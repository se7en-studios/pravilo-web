import fs from "fs";
import path from "path";
import {
  Booking,
  BankConfig,
  DEFAULT_BANK_CONFIG,
  GiftCard,
  StudentClinicalProfile,
} from "./bookings";
import { DEFAULT_SCHEDULE_CONFIG, ScheduleConfig } from "./availability";
import { GalleryImageItem, DEFAULT_GALLERY_IMAGES } from "./gallery";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("[serverStorage] Error creating data directory:", err);
  }
}

/**
 * Store JSON respaldado por archivo (fallback local cuando Firestore no está
 * configurado, y cache espejo cuando sí lo está), con:
 * - Relectura automática cuando el archivo cambia en disco (mtime/size), para
 *   que múltiples copias del módulo (route handlers, server components, dev
 *   HMR) nunca sirvan datos viejos.
 * - Escritura atómica (tmp + rename) con un reintento directo (OneDrive/
 *   Windows lockea archivos intermitentemente).
 * - La cache en memoria SOLO se actualiza si la escritura a disco fue exitosa:
 *   si `write` devuelve false, el estado servido sigue siendo el real.
 */
interface JsonStore<T> {
  read(): T;
  write(value: T): boolean;
}

function createJsonStore<T>(options: {
  file: string;
  /** Valor inicial cuando el archivo todavía no existe (primer arranque). */
  seed: () => T;
  /** Valor a servir si el archivo existe pero está corrupto (se respalda antes). */
  onCorrupt?: () => T;
  /** Validación estructural del JSON parseado. */
  validate: (parsed: unknown) => boolean;
  /** Persistir el seed a disco cuando el archivo no existe. */
  persistSeed?: boolean;
}): JsonStore<T> {
  const filePath = path.join(DATA_DIR, options.file);
  let cache: T | null = null;
  let cachedMtimeMs = -1;
  let cachedSize = -1;

  const write = (value: T): boolean => {
    ensureDataDir();
    const tmpPath = `${filePath}.tmp`;
    const payload = JSON.stringify(value, null, 2);

    let ok = false;
    try {
      fs.writeFileSync(tmpPath, payload, "utf-8");
      fs.renameSync(tmpPath, filePath);
      ok = true;
    } catch (err) {
      // Reintento directo: rename puede fallar con EPERM en Windows/OneDrive.
      try {
        fs.writeFileSync(filePath, payload, "utf-8");
        ok = true;
      } catch (err2) {
        console.error(`[serverStorage] No se pudo escribir ${options.file}:`, err2 ?? err);
      }
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
    }

    if (ok) {
      cache = value;
      try {
        const stat = fs.statSync(filePath);
        cachedMtimeMs = stat.mtimeMs;
        cachedSize = stat.size;
      } catch {
        // Forzar relectura en el próximo read.
        cachedMtimeMs = -1;
        cachedSize = -1;
      }
    }
    return ok;
  };

  /** Espera sincrónica breve (para reintentar lecturas con el archivo lockeado). */
  const sleepSync = (ms: number) => {
    try {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    } catch {}
  };

  const read = (): T => {
    let stat: fs.Stats | null = null;
    let statError: unknown = null;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      stat = null;
      statError = err;
    }

    if (stat && cache !== null && stat.mtimeMs === cachedMtimeMs && stat.size === cachedSize) {
      return cache;
    }

    // Archivo genuinamente inexistente: primer arranque → seed.
    // (Cualquier otro error de stat —p.ej. EPERM por lock de OneDrive— NO es
    // "no existe": se trata como error de I/O más abajo.)
    const isMissing =
      stat === null && (statError as NodeJS.ErrnoException | null)?.code === "ENOENT";
    if (isMissing) {
      const initial = options.seed();
      if (options.persistSeed) {
        write(initial);
      }
      cache = initial;
      return initial;
    }

    // Leer el contenido, con reintentos: OneDrive/Windows lockea archivos
    // intermitentemente y una falla de I/O NO significa que el archivo esté
    // corrupto ni vacío.
    let raw: string | null = null;
    let ioError: unknown = statError;
    for (let attempt = 0; attempt < 3 && raw === null; attempt++) {
      if (attempt > 0) sleepSync(40 * attempt);
      try {
        raw = fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        ioError = err;
      }
    }

    if (raw === null) {
      // Error de I/O persistente. Con cache válida, servirla; sin cache, LANZAR:
      // jamás inventar un estado vacío que una escritura posterior haría permanente.
      if (cache !== null) {
        console.error(`[serverStorage] ${options.file}: error de I/O, sirviendo cache:`, ioError);
        return cache;
      }
      console.error(`[serverStorage] ${options.file}: error de I/O sin cache:`, ioError);
      throw new Error(
        `No se pudo leer el almacenamiento (${options.file}): archivo bloqueado o inaccesible. Reintentá en unos segundos.`,
      );
    }

    try {
      const parsed = JSON.parse(raw);
      if (options.validate(parsed)) {
        cache = parsed as T;
        if (stat) {
          cachedMtimeMs = stat.mtimeMs;
          cachedSize = stat.size;
        } else {
          cachedMtimeMs = -1;
          cachedSize = -1;
        }
        return cache;
      }
      throw new Error("El contenido no pasó la validación estructural");
    } catch (err) {
      // Corrupción real (se pudo LEER pero no parsear/validar): respaldar y
      // servir el fallback. Nunca pisar el archivo original.
      console.error(`[serverStorage] ${options.file} corrupto:`, err);
      if (cache !== null) return cache;
      try {
        fs.copyFileSync(filePath, `${filePath}.corrupt-${Date.now()}`);
      } catch {}
      const fallback = (options.onCorrupt ?? options.seed)();
      cache = fallback;
      if (stat) {
        cachedMtimeMs = stat.mtimeMs;
        cachedSize = stat.size;
      }
      return fallback;
    }
  };

  return { read, write };
}

function isPlainObject(v: unknown): boolean {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ----------------- BOOKINGS -----------------
// ponytail: sin archivo y sin cache significa "todavía no hay datos locales",
// NO "sembrar turnos de muestra". El auto-seed acá resucitaba turnos
// fabricados cada vez que Firestore no estaba disponible y este fallback
// entraba en juego. Los turnos de muestra se cargan solo a pedido
// (botón "Cargar turnos" → resetWithSamples).
const bookingsStore = createJsonStore<Booking[]>({
  file: "bookings.json",
  seed: () => [],
  validate: (parsed) => Array.isArray(parsed),
  persistSeed: false,
});

export function getServerBookings(): Booking[] {
  return bookingsStore.read();
}

export function saveServerBookings(bookings: Booking[]): boolean {
  return bookingsStore.write(bookings);
}

// ----------------- SCHEDULE CONFIG -----------------
const configStore = createJsonStore<ScheduleConfig>({
  file: "config.json",
  seed: () => ({ ...DEFAULT_SCHEDULE_CONFIG }),
  validate: (parsed) => isPlainObject(parsed) && Array.isArray((parsed as ScheduleConfig).days),
  persistSeed: true,
});

export function getServerScheduleConfig(): ScheduleConfig {
  return configStore.read();
}

export function saveServerScheduleConfig(config: ScheduleConfig): boolean {
  return configStore.write(config);
}

// ----------------- BANK CONFIG -----------------
const bankStore = createJsonStore<BankConfig>({
  file: "bank.json",
  seed: () => ({ ...DEFAULT_BANK_CONFIG }),
  validate: isPlainObject,
  persistSeed: true,
});

export function getServerBankConfig(): BankConfig {
  return bankStore.read();
}

export function saveServerBankConfig(bank: BankConfig): boolean {
  return bankStore.write(bank);
}

// ----------------- PLAN PRICES CONFIG -----------------
export const DEFAULT_PLAN_PRICES = {
  individual: "$35.000",
  pack8: "$240.000",
  pack12: "$300.000",
  individualDesc: "Precio de lanzamiento · 60 min.",
  pack8Desc: "$30.000 por sesión · Vigencia: 2 meses.",
  pack12Desc: "$25.000 por sesión · Vigencia: 3 meses.",
};

const pricesStore = createJsonStore<Record<string, string | undefined>>({
  file: "prices.json",
  seed: () => ({ ...DEFAULT_PLAN_PRICES }),
  validate: isPlainObject,
  persistSeed: true,
});

export function getServerPlanPrices(): Record<string, string | undefined> {
  return pricesStore.read();
}

export function saveServerPlanPrices(prices: Record<string, string | undefined>): boolean {
  return pricesStore.write(prices);
}

// ----------------- CLINICAL PROFILES -----------------
const clinicalStore = createJsonStore<Record<string, StudentClinicalProfile>>({
  file: "clinical.json",
  seed: () => ({}),
  validate: isPlainObject,
  persistSeed: false,
});

export function getServerClinicalProfiles(): Record<string, StudentClinicalProfile> {
  return clinicalStore.read();
}

export function saveServerClinicalProfiles(
  profiles: Record<string, StudentClinicalProfile>,
): boolean {
  return clinicalStore.write(profiles);
}

// ----------------- GIFT CARDS -----------------
const giftCardsStore = createJsonStore<GiftCard[]>({
  file: "giftcards.json",
  seed: () => [],
  validate: (parsed) => Array.isArray(parsed),
  persistSeed: false,
});

export function getServerGiftCards(): GiftCard[] {
  return giftCardsStore.read();
}

export function saveServerGiftCards(cards: GiftCard[]): boolean {
  return giftCardsStore.write(cards);
}

// ----------------- GALLERY -----------------
const galleryStore = createJsonStore<GalleryImageItem[]>({
  file: "gallery.json",
  seed: () => [...DEFAULT_GALLERY_IMAGES],
  validate: (parsed) => Array.isArray(parsed),
  persistSeed: true,
});

export function getServerGalleryImages(): GalleryImageItem[] {
  return galleryStore.read();
}

export function saveServerGalleryImages(images: GalleryImageItem[]): boolean {
  return galleryStore.write(images);
}
