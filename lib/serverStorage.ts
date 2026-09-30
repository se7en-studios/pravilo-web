import fs from "fs";
import path from "path";
import {
  Booking,
  BankConfig,
  DEFAULT_BANK_CONFIG,
  GiftCard,
  StudentClinicalProfile,
  MessageTemplatesConfig,
  DEFAULT_MESSAGE_TEMPLATES,
} from "./bookings";
import { DEFAULT_SCHEDULE_CONFIG, ScheduleConfig } from "./availability";
import { GalleryImageItem, DEFAULT_GALLERY_IMAGES } from "./gallery";

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const BANK_FILE = path.join(DATA_DIR, "bank.json");
const PRICES_FILE = path.join(DATA_DIR, "prices.json");
const CLINICAL_FILE = path.join(DATA_DIR, "clinical.json");
const GIFTCARDS_FILE = path.join(DATA_DIR, "giftcards.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

export const DEFAULT_PLAN_PRICES = {
  individual: "$35.000",
  pack8: "$240.000",
  pack12: "$300.000",
  individualDesc: "Precio de lanzamiento · 60 min.",
  pack8Desc: "$30.000 por sesión · Vigencia: 2 meses.",
  pack12Desc: "$25.000 por sesión · Vigencia: 3 meses.",
};

// In-memory memory fallback caches (for read-only serverless filesystems if any)
let cachedBookings: Booking[] | null = null;
let isBookingsLoaded = false;
let cachedConfig: ScheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
let cachedBank: BankConfig = { ...DEFAULT_BANK_CONFIG };
let cachedPrices: Record<string, string | undefined> = {
  ...DEFAULT_PLAN_PRICES,
};
let cachedClinical: Record<string, StudentClinicalProfile> = {};
let cachedGiftCards: GiftCard[] = [];
let cachedMessages: MessageTemplatesConfig = { ...DEFAULT_MESSAGE_TEMPLATES };

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating data directory:", err);
  }
}

// ----------------- BOOKINGS -----------------
export function getServerBookings(): Booking[] {
  if (isBookingsLoaded && cachedBookings !== null) {
    return cachedBookings;
  }

  ensureDataDir();

  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const raw = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedBookings = parsed;
        isBookingsLoaded = true;
        return cachedBookings;
      }
    }
  } catch (err) {
    console.error("Error reading bookings file:", err);
  }

  // ponytail: no file and no cache means "no local data yet", not "seed fake
  // bookings". Auto-seeding here used to resurrect fabricated sample turnos
  // any time Firestore was unreachable and this fs fallback kicked in.
  cachedBookings = [];
  isBookingsLoaded = true;
  return cachedBookings;
}

export function saveServerBookings(bookings: Booking[]): boolean {
  cachedBookings = bookings;
  isBookingsLoaded = true;
  ensureDataDir();

  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving bookings to file:", err);
    return false;
  }
}

// ----------------- SCHEDULE CONFIG -----------------
export function getServerScheduleConfig(): ScheduleConfig {
  ensureDataDir();

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.days)) {
        cachedConfig = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading config file:", err);
  }

  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = { ...DEFAULT_SCHEDULE_CONFIG };
  saveServerScheduleConfig(cachedConfig);
  return cachedConfig;
}

export function saveServerScheduleConfig(config: ScheduleConfig): boolean {
  cachedConfig = config;
  ensureDataDir();

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving config to file:", err);
    return false;
  }
}

// ----------------- BANK CONFIG -----------------
export function getServerBankConfig(): BankConfig {
  ensureDataDir();

  try {
    if (fs.existsSync(BANK_FILE)) {
      const raw = fs.readFileSync(BANK_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.alias) {
        cachedBank = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading bank file:", err);
  }

  if (cachedBank) {
    return cachedBank;
  }

  cachedBank = { ...DEFAULT_BANK_CONFIG };
  saveServerBankConfig(cachedBank);
  return cachedBank;
}

export function saveServerBankConfig(bank: BankConfig): boolean {
  cachedBank = bank;
  ensureDataDir();

  try {
    fs.writeFileSync(BANK_FILE, JSON.stringify(bank, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving bank to file:", err);
    return false;
  }
}

// ----------------- PLAN PRICES CONFIG -----------------
export function getServerPlanPrices(): Record<string, string | undefined> {
  ensureDataDir();

  try {
    if (fs.existsSync(PRICES_FILE)) {
      const raw = fs.readFileSync(PRICES_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.individual) {
        cachedPrices = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading prices file:", err);
  }

  if (cachedPrices) {
    return cachedPrices;
  }

  cachedPrices = { ...DEFAULT_PLAN_PRICES };
  saveServerPlanPrices(cachedPrices);
  return cachedPrices;
}

export function saveServerPlanPrices(
  prices: Record<string, string | undefined>,
): boolean {
  cachedPrices = prices;
  ensureDataDir();

  try {
    fs.writeFileSync(PRICES_FILE, JSON.stringify(prices, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving prices to file:", err);
    return false;
  }
}

// ----------------- CLINICAL PROFILES -----------------
export function getServerClinicalProfiles(): Record<string, StudentClinicalProfile> {
  ensureDataDir();

  try {
    if (fs.existsSync(CLINICAL_FILE)) {
      const raw = fs.readFileSync(CLINICAL_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        cachedClinical = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading clinical file:", err);
  }

  return cachedClinical || {};
}

export function saveServerClinicalProfiles(
  profiles: Record<string, StudentClinicalProfile>,
): boolean {
  cachedClinical = profiles;
  ensureDataDir();

  try {
    fs.writeFileSync(CLINICAL_FILE, JSON.stringify(profiles, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving clinical to file:", err);
    return false;
  }
}

// ----------------- GIFT CARDS -----------------
export function getServerGiftCards(): GiftCard[] {
  ensureDataDir();

  try {
    if (fs.existsSync(GIFTCARDS_FILE)) {
      const raw = fs.readFileSync(GIFTCARDS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedGiftCards = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading giftcards file:", err);
  }

  return cachedGiftCards || [];
}

export function saveServerGiftCards(cards: GiftCard[]): boolean {
  cachedGiftCards = cards;
  ensureDataDir();

  try {
    fs.writeFileSync(GIFTCARDS_FILE, JSON.stringify(cards, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving giftcards to file:", err);
    return false;
  }
}

const GALLERY_FILE = path.join(DATA_DIR, "gallery.json");
let cachedGallery: GalleryImageItem[] | null = null;
let isGalleryLoaded = false;

export function getServerGalleryImages(): GalleryImageItem[] {
  if (isGalleryLoaded && cachedGallery) {
    return cachedGallery;
  }

  ensureDataDir();

  try {
    if (fs.existsSync(GALLERY_FILE)) {
      const raw = fs.readFileSync(GALLERY_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedGallery = parsed;
        isGalleryLoaded = true;
        return cachedGallery;
      }
    }
  } catch (err) {
    console.error("Error reading gallery file:", err);
  }

  cachedGallery = [...DEFAULT_GALLERY_IMAGES];
  isGalleryLoaded = true;
  saveServerGalleryImages(cachedGallery);
  return cachedGallery;
}

export function saveServerGalleryImages(images: GalleryImageItem[]): boolean {
  cachedGallery = images;
  isGalleryLoaded = true;
  ensureDataDir();

  try {
    fs.writeFileSync(GALLERY_FILE, JSON.stringify(images, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving gallery to file:", err);
    return false;
  }
}

// ----------------- MESSAGE TEMPLATES -----------------
export function getServerMessageTemplates(): MessageTemplatesConfig {
  ensureDataDir();

  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        cachedMessages = { ...DEFAULT_MESSAGE_TEMPLATES, ...parsed };
        return cachedMessages;
      }
    }
  } catch (err) {
    console.error("Error reading messages file:", err);
  }

  return cachedMessages;
}

export function saveServerMessageTemplates(
  templates: MessageTemplatesConfig,
): boolean {
  cachedMessages = { ...DEFAULT_MESSAGE_TEMPLATES, ...templates };
  ensureDataDir();

  try {
    fs.writeFileSync(
      MESSAGES_FILE,
      JSON.stringify(cachedMessages, null, 2),
      "utf-8",
    );
    return true;
  } catch (err) {
    console.error("Error saving messages to file:", err);
    return false;
  }
}
