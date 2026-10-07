import { WHATSAPP_NUMBER } from "./constants";
import { Plan } from "./plans";
import { type Booking, expandBookingSessions } from "./bookings";

export interface DaySchedule {
  dayIndex: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  dayName: string;
  enabled: boolean;
  slots: string[];
}

export interface ScheduleConfig {
  days: DaySchedule[];
  blockedDates: string[]; // YYYY-MM-DD
  blockedDateReasons?: Record<string, string>; // YYYY-MM-DD -> "Feriado / Motivo"
  whatsappNumber: string;
  sessionDurationMinutes: number;
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  sessionDurationMinutes: 60,
  whatsappNumber: WHATSAPP_NUMBER,
  blockedDates: [],
  blockedDateReasons: {},
  days: [
    {
      dayIndex: 0,
      dayName: "Domingo",
      enabled: false,
      slots: [],
    },
    {
      dayIndex: 1,
      dayName: "Lunes",
      enabled: true,
      slots: ["09:00", "10:30", "15:00", "16:30", "18:00", "19:30"],
    },
    {
      dayIndex: 2,
      dayName: "Martes",
      enabled: true,
      slots: ["09:00", "10:30", "15:00", "16:30", "18:00", "19:30"],
    },
    {
      dayIndex: 3,
      dayName: "Miércoles",
      enabled: true,
      slots: ["09:00", "10:30", "15:00", "16:30", "18:00", "19:30"],
    },
    {
      dayIndex: 4,
      dayName: "Jueves",
      enabled: true,
      slots: ["09:00", "10:30", "15:00", "16:30", "18:00", "19:30"],
    },
    {
      dayIndex: 5,
      dayName: "Viernes",
      enabled: true,
      slots: ["09:00", "10:30", "15:00", "16:30", "18:00", "19:30"],
    },
    {
      dayIndex: 6,
      dayName: "Sábado",
      enabled: true,
      slots: ["09:30", "11:00", "15:00", "16:30"],
    },
  ],
};

export const LOCAL_STORAGE_SCHEDULE_KEY = "pravilo_schedule_config_v1";

export function getScheduleConfig(): ScheduleConfig {
  if (typeof window === "undefined") {
    return DEFAULT_SCHEDULE_CONFIG;
  }
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_SCHEDULE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // fallback
  }
  return DEFAULT_SCHEDULE_CONFIG;
}

export function saveScheduleConfig(config: ScheduleConfig): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_SCHEDULE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isDateAvailable(
  date: Date,
  config: ScheduleConfig = DEFAULT_SCHEDULE_CONFIG,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // No permitir fechas pasadas
  if (targetDate < today) return false;

  // Max 60 días hacia adelante
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 60);
  if (targetDate > maxDate) return false;

  // Comprobar si la fecha específica está bloqueada
  const iso = formatDateISO(targetDate);
  if (config.blockedDates.includes(iso)) return false;

  // Comprobar si el día de la semana está habilitado y tiene slots
  const dayIndex = targetDate.getDay();
  const daySchedule = config.days.find((d) => d.dayIndex === dayIndex);
  return !!(daySchedule && daySchedule.enabled && daySchedule.slots.length > 0);
}

export function getBookedSlotsForDate(
  dateStr: string,
  bookings: Booking[] = [],
): Set<string> {
  const occupied = new Set<string>();
  bookings.flatMap(expandBookingSessions).forEach((b) => {
    // Si el turno está confirmado o pendiente activo (no cancelado), ocupa el horario
    if (b.date === dateStr && b.status !== "cancelado" && b.time) {
      occupied.add(b.time.trim());
    }
  });
  return occupied;
}

export function isDateFullyBooked(
  date: Date,
  config: ScheduleConfig = DEFAULT_SCHEDULE_CONFIG,
  bookings: Booking[] = [],
): boolean {
  if (!isDateAvailable(date, config)) return true;
  const iso = formatDateISO(date);
  const dayIndex = date.getDay();
  const daySchedule = config.days.find((d) => d.dayIndex === dayIndex);
  if (!daySchedule || !daySchedule.enabled || daySchedule.slots.length === 0) return true;

  const bookedSlots = getBookedSlotsForDate(iso, bookings);
  return daySchedule.slots.every((slot) => bookedSlots.has(slot.trim()));
}

export function getAvailableSlots(
  date: Date,
  config: ScheduleConfig = DEFAULT_SCHEDULE_CONFIG,
  bookings: Booking[] = [],
): string[] {
  if (!isDateAvailable(date, config)) return [];
  const iso = formatDateISO(date);
  const dayIndex = date.getDay();
  const daySchedule = config.days.find((d) => d.dayIndex === dayIndex);
  if (!daySchedule || !daySchedule.enabled) return [];

  const bookedSlots = getBookedSlotsForDate(iso, bookings);
  return daySchedule.slots.filter((slot) => !bookedSlots.has(slot.trim()));
}

export function getAllSlotsWithStatus(
  date: Date,
  config: ScheduleConfig = DEFAULT_SCHEDULE_CONFIG,
  bookings: Booking[] = [],
): { slot: string; isAvailable: boolean; reason?: string }[] {
  if (!isDateAvailable(date, config)) return [];
  const iso = formatDateISO(date);
  const dayIndex = date.getDay();
  const daySchedule = config.days.find((d) => d.dayIndex === dayIndex);
  if (!daySchedule || !daySchedule.enabled) return [];

  const bookedSlots = getBookedSlotsForDate(iso, bookings);

  return daySchedule.slots.map((slot) => {
    const isBooked = bookedSlots.has(slot.trim());
    return {
      slot,
      isAvailable: !isBooked,
      reason: isBooked ? "Horario ya ocupado / confirmado" : undefined,
    };
  });
}

const DIAS_SEMANA_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatDateSpanish(date: Date): string {
  const dayName = DIAS_SEMANA_ES[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MESES_ES[date.getMonth()];
  return `${dayName} ${dayNum} de ${monthName}`;
}

export function buildWhatsAppBookingMessage({
  plan,
  date,
  time,
  customerName,
  customerPhone,
  customerNotes,
}: {
  plan: Plan;
  date: Date;
  time: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
}): string {
  const formattedDate = formatDateSpanish(date);
  let message = `¡Hola Juan! Quiero reservar un turno para *PRAVILO ARG*:\n\n`;
  message += `📋 *Plan:* ${plan.title} (${plan.price})\n`;
  message += `📅 *Fecha:* ${formattedDate}\n`;
  message += `⏰ *Horario:* ${time} hs\n`;
  message += `👤 *Nombre:* ${customerName.trim()}\n`;
  if (customerPhone && customerPhone.trim()) {
    message += `📱 *Teléfono:* ${customerPhone.trim()}\n`;
  }
  if (customerNotes && customerNotes.trim()) {
    message += `💬 *Comentarios:* ${customerNotes.trim()}\n`;
  }
  message += `\n¿Me confirmás disponibilidad? ¡Gracias!`;
  return message;
}

export function buildWhatsAppBookingUrl(
  params: {
    plan: Plan;
    date: Date;
    time: string;
    customerName: string;
    customerPhone?: string;
    customerNotes?: string;
  },
  whatsappNum: string = WHATSAPP_NUMBER,
): string {
  const text = buildWhatsAppBookingMessage(params);
  return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(text)}`;
}
