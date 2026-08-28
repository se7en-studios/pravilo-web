import { timingSafeEqual } from "crypto";

/**
 * PIN del panel de administración.
 * Configurable vía variable de entorno ADMIN_PIN; si no está definida se usa
 * el valor histórico para no romper el acceso existente.
 */
export function getAdminPin(): string {
  const fromEnv = process.env.ADMIN_PIN?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "pravilo2026";
}

/** Compara el PIN recibido contra el esperado en tiempo constante. */
export function isValidAdminPin(pin: unknown): boolean {
  if (typeof pin !== "string" || pin.length === 0 || pin.length > 128) {
    return false;
  }
  const expected = Buffer.from(getAdminPin(), "utf-8");
  const received = Buffer.from(pin, "utf-8");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * ¿El request trae credenciales de administrador válidas?
 * El panel manda el PIN en el header `x-admin-pin`.
 */
export function isAdminRequest(req: Request): boolean {
  return isValidAdminPin(req.headers.get("x-admin-pin") ?? "");
}

// Throttle simple en memoria contra fuerza bruta del PIN (por instancia).
const FAILED_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_IN_WINDOW = 10;
let failedAttempts: number[] = [];

export function registerFailedPinAttempt(): void {
  const now = Date.now();
  failedAttempts = failedAttempts.filter((t) => now - t < FAILED_WINDOW_MS);
  failedAttempts.push(now);
}

export function isPinThrottled(): boolean {
  const now = Date.now();
  failedAttempts = failedAttempts.filter((t) => now - t < FAILED_WINDOW_MS);
  return failedAttempts.length >= MAX_FAILED_IN_WINDOW;
}
