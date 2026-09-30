import {
  GOOGLE_MAPS_URL,
  GOOGLE_WRITE_REVIEW_URL,
  LOCATION,
} from "@/lib/constants";

export type PaymentStatus =
  | "pendiente"
  | "seña"
  | "pagado_efectivo"
  | "pagado_transferencia"
  | "pagado_mp";

export type PaymentMethod =
  "efectivo" | "transferencia" | "mercadopago" | "otro";

export interface ClinicalEvolutionLog {
  date: string;
  sessionNumber?: number;
  painBefore: number; // 0 a 10 (EVA)
  painAfter: number; // 0 a 10 (EVA)
  tensionLevel?: "Leve" | "Moderada" | "Alta" | "Muy Alta";
  notes: string;
  instructor?: string;
}

export interface StudentClinicalProfile {
  studentName?: string;
  conditionReason?: string; // Motivo de consulta (ej. Lumbalgia L5, Hernia, Contractura, Movilidad)
  painLevelInitial?: number; // 1 a 10
  painLevelCurrent?: number; // 1 a 10
  tags?: string[];
  medicalNotes?: string;
  emergencyContact?: { name: string; phone: string; relation?: string };
  sessionLogs?: { date: string; note: string; tensionLevel?: string }[];
  evolutionLogs?: ClinicalEvolutionLog[];
  signatureBase64?: string;
  signatureDate?: string;
  hasSignedConsent?: boolean;
}

export interface Booking {
  id: string;
  createdAt: string; // ISO string
  planTitle: string;
  planPrice: string;
  totalAmount?: number; // Valor numérico total
  amountPaid?: number; // Monto abonado o seña
  paymentMethod?: PaymentMethod;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  internalNotes?: string;
  paymentStatus?: PaymentStatus;
  sessionsCompleted?: number;
  totalSessions?: number;
  tags?: string[];
  status: "pendiente" | "confirmado" | "realizado" | "cancelado";
  clinicalProfile?: StudentClinicalProfile;
}

export interface GiftCard {
  id: string;
  code: string;
  recipientName: string;
  recipientPhone?: string;
  senderName: string;
  senderPhone?: string;
  planTitle: string;
  price: string;
  customMessage?: string;
  createdAt: string;
  status: "activo" | "canjeado" | "expirado";
  redeemedAt?: string;
  redeemedBy?: string;
}

export interface BankConfig {
  alias: string;
  cbu: string;
  titular: string;
  banco: string;
  accountHolder?: string;
  bankName?: string;
  cuit?: string;
}

// cbu/banco/cuit quedan vacíos a propósito: son datos financieros reales que
// tiene que cargar el admin desde la pestaña "Banco". Los mensajes de
// WhatsApp que arman estos datos (buildQuickWhatsAppMessage,
// buildReceiptWhatsAppMessage) ya omiten cada línea si el campo viene
// vacío — antes tenían un CBU/CUIT de relleno que se le podía mostrar a un
// cliente real como si fuera la cuenta para transferir.
export const DEFAULT_BANK_CONFIG: BankConfig = {
  alias: "PRAVILO.ARG",
  cbu: "",
  titular: "Juan Ignacio Garrafa",
  banco: "",
  accountHolder: "Juan Ignacio Garrafa",
  bankName: "",
  cuit: "",
};

export const LOCAL_STORAGE_BOOKINGS_KEY = "pravilo_bookings_data_v1";
export const LOCAL_STORAGE_BANK_KEY = "pravilo_bank_config_v1";
export const LOCAL_STORAGE_CLINICAL_KEY = "pravilo_student_clinical_v1";
export const LOCAL_STORAGE_GIFTCARDS_KEY = "pravilo_giftcards_v1";
export const LOCAL_STORAGE_PRICES_KEY = "pravilo_plan_prices_v1";
export const LOCAL_STORAGE_MESSAGES_KEY = "pravilo_messages_config_v1";

export interface MessageTemplatesConfig {
  confirmar: string;
  recordatorio: string;
  reagendar: string;
  seguimiento_post: string;
  pago: string;
  ubicacion: string;
  renovacion: string;
  resena: string;
  reactivacion: string;
  giftcard: string;
  comprobante: string;
  autoPromptReviewOnComplete?: boolean;
  autoPromptConfirmOnConfirm?: boolean;
}

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplatesConfig = {
  confirmar: `¡Hola {nombre}! 👋 Te escribo de *PRAVILO ARG* para confirmarte tu turno:\n\n📋 *Plan:* {plan}\n📅 *Día:* {fecha}\n⏰ *Horario:* {hora} hs\n📍 *Ubicación:* Plottier, Neuquén\n\n¡Tu sesión quedó confirmada! Te recomendamos venir con ropa cómoda deportiva. ¡Te esperamos! 🙌`,

  recordatorio: `¡Hola {nombre}! 👋 Te recordamos tu sesión de *PRAVILO ARG* programada para {dia_relativo} a las *{hora} hs*.\n\nRecordá asistir con ropa deportiva cómoda e hidratarte bien. ¡Nos vemos en el estudio! 🧘‍♂️`,

  reagendar: `¡Hola {nombre}! 👋 Te escribo de *PRAVILO ARG* con respecto a tu turno del {fecha} a las {hora} hs.\n\n¿Tendrías disponibilidad para coordinar un nuevo día u horario? ¡Avisame y lo acomodamos!`,

  seguimiento_post: `¡Hola {nombre}! 👋 ¿Cómo amaneció tu cuerpo hoy después de la sesión de PRAVILO?\n\nRecordá tomar bastante agua hoy para acompañar la hidratación fascial y no dudes en avisarme si tenés alguna duda o consulta. ¡Te esperamos pronto en el estudio! 🙌`,

  pago: `¡Hola {nombre}! 👋 Te paso los datos bancarios para abonar tu sesión/pack de *PRAVILO ARG*:\n\n💰 *Monto:* {monto}\n💳 *Alias:* {alias}\n{datos_bancarios}\nUna vez realizada la transferencia, envianos el comprobante por acá para registrarlo. ¡Muchas gracias! 🙌`,

  ubicacion: `¡Hola {nombre}! 👋 Te comparto la ubicación y referencias para llegar al estudio de *PRAVILO ARG* en Plottier:\n\n📍 *Dirección:* {ubicacion}\n🗺️ *Google Maps:* {maps_url}\n\nCualquier duda al llegar, avisanos por este medio. ¡Buen viaje! 🚗`,

  renovacion: `¡Hola {nombre}! 👋 ¡Felicitaciones por el avance logrado en tus sesiones de PRAVILO! 🌟\n\nEstás completando tu pack actual. Si querés renovar para el próximo mes y asegurar tu cupo y horarios habituales, avisame y te reservo tu lugar con la tarifa del pack. ¡Seguimos trabajando en tu movilidad! 🙌`,

  resena: `¡Hola {nombre}! 👋 Te escribo de *PRAVILO ARG*.\n\nQueríamos agradecerte por confiar en nosotros para tu entrenamiento y descompresión corporal. 🧘‍♂️✨\n\n¿Nos ayudarías dejando una breve reseña en Google sobre tu experiencia? Nos ayuda muchísimo a que más personas descubran los beneficios del método Pravilo en Neuquén:\n\n⭐ *Dejar Reseña en Google:* {review_url}\n\n¡Muchas gracias por tu apoyo y nos vemos en la próxima sesión! 🙌`,

  reactivacion: `¡Hola {nombre}! 👋 Te escribo desde *PRAVILO ARG* en Plottier.\n\n{texto_ultima_fecha}¿Cómo te venís sintiendo con tu postura y movilidad?\n\nTe escribo para ver si te gustaría agendar una nueva sesión esta semana para continuar liberando tensión fascial y descomprimir la columna. ¡Avisame y coordinamos! 🙌`,

  giftcard: `🎁 *¡VOUCHER / GIFT CARD DIGITAL PRAVILO ARG!* 🌟\n\n👤 *Para:* {destinatario}\n🤝 *De parte de:* {remitente}\n📋 *Experiencia:* {plan} ({monto})\n🎟️ *Código de Canje:* \`{codigo}\`\n{mensaje_personalizado}\n──────────────────\n📍 *Ubicación:* Plottier, Neuquén\n📲 Para coordinar día y horario, respondé a este mensaje mencionando tu código de canje.\n¡Que disfrutes tu sesión de descompresión y bienestar! 🙌`,

  comprobante: `🧾 *COMPROBANTE / DETALLE DE PAGO - PRAVILO ARG*\n\n👤 *Alumno:* {nombre}\n📋 *Plan/Servicio:* {plan}\n📅 *Turno:* {fecha} - {hora} hs\n──────────────────\n💰 *Total del Plan:* {total}\n✅ *Abonado / Seña:* {abonado}\n⏳ *Saldo Pendiente:* {saldo}\n──────────────────\n\n{detalle_pago_saldo}📍 Estudio PRAVILO: Plottier, Neuquén.`,

  autoPromptReviewOnComplete: true,
  autoPromptConfirmOnConfirm: true,
};

export function generateSampleBookings(): Booking[] {
  const formatDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(0);
  const tomorrowStr = formatDate(1);
  const in2DaysStr = formatDate(2);
  const yesterdayStr = formatDate(-1);
  const threeDaysAgoStr = formatDate(-3);

  return [
    {
      id: "bk_sample_1",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      customerName: "Martín Benítez",
      customerPhone: "+54 9 299 458-1290",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 35000,
      paymentMethod: "transferencia",
      paymentStatus: "pagado_transferencia",
      date: yesterdayStr,
      time: "16:30",
      customerNotes:
        "Molestia lumbar L5-S1 al estar sentado mucho tiempo en oficina.",
      internalNotes:
        "Comenzar con tracción suave y arnés acolchado de tobillos.",
      tags: ["Lumbalgia", "Oficina", "Individual"],
      status: "realizado",
      totalSessions: 1,
      sessionsCompleted: 1,
    },
    {
      id: "bk_sample_2",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      customerName: "Sofía Álvarez",
      customerPhone: "+54 9 299 512-8844",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 35000,
      paymentMethod: "transferencia",
      paymentStatus: "pagado_transferencia",
      date: todayStr,
      time: "18:00",
      customerNotes:
        "Cervicalgia y tensión en hombros por entrenamiento de crossfit.",
      internalNotes: "Excelente respuesta en descompresión dorsal.",
      tags: ["Cervicalgia", "Deportista", "Primera Vez"],
      status: "confirmado",
      totalSessions: 1,
      sessionsCompleted: 0,
    },
    {
      id: "bk_sample_3",
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      customerName: "Gonzalo Morales",
      customerPhone: "+54 9 299 634-9021",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 0,
      paymentMethod: "efectivo",
      paymentStatus: "pendiente",
      date: tomorrowStr,
      time: "19:30",
      customerNotes: "Recomendado por su kinesiólogo para elongación profunda.",
      internalNotes: "Pendiente abonar o transferir seña antes de la sesión.",
      tags: ["Recomendado", "Primera Vez"],
      status: "pendiente",
      totalSessions: 1,
      sessionsCompleted: 0,
    },
    {
      id: "bk_sample_4",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      customerName: "Camila Vázquez",
      customerPhone: "+54 9 299 411-7320",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 35000,
      paymentMethod: "transferencia",
      paymentStatus: "pagado_transferencia",
      date: tomorrowStr,
      time: "10:30",
      customerNotes:
        "Plan integral de corrección postural y fortalecimiento miofascial.",
      internalNotes: "Gran avance en rotación de cadera y movilidad torácica.",
      tags: ["Postura", "Fascial"],
      status: "confirmado",
      totalSessions: 1,
      sessionsCompleted: 0,
    },
    {
      id: "bk_sample_5",
      createdAt: new Date(Date.now() - 90000000).toISOString(),
      customerName: "Federico Rossi",
      customerPhone: "+54 9 299 567-3312",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 35000,
      paymentMethod: "mercadopago",
      paymentStatus: "pagado_mp",
      date: in2DaysStr,
      time: "16:00",
      customerNotes: "Contractura escapular crónica y rigidez torácica.",
      internalNotes: "Verificar ajuste de muñequeras en suspensión.",
      tags: ["Dorsal"],
      status: "confirmado",
      totalSessions: 1,
      sessionsCompleted: 0,
    },
    {
      id: "bk_sample_6",
      createdAt: new Date(Date.now() - 120000000).toISOString(),
      customerName: "Lucía Domínguez",
      customerPhone: "+54 9 299 489-0055",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 0,
      paymentMethod: "transferencia",
      paymentStatus: "pendiente",
      date: in2DaysStr,
      time: "17:30",
      customerNotes: "Busca alivio para compresión discal y estrés.",
      internalNotes:
        "Enviar mensaje de recordatorio y datos de alias bancario.",
      tags: ["Primera Vez", "Descompresión"],
      status: "pendiente",
      totalSessions: 1,
      sessionsCompleted: 0,
    },
    {
      id: "bk_sample_7",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      customerName: "Esteban Cabrera",
      customerPhone: "+54 9 299 402-9911",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 35000,
      paymentMethod: "transferencia",
      paymentStatus: "pagado_transferencia",
      date: yesterdayStr,
      time: "18:00",
      customerNotes:
        "Sesión realizada exitosamente. Reducción notable del dolor.",
      internalNotes:
        "Dolor bajó de 8/10 a 2/10. Muy satisfecho con la tracción.",
      tags: ["Realizado"],
      status: "realizado",
      totalSessions: 1,
      sessionsCompleted: 1,
    },
    {
      id: "bk_sample_8",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      customerName: "Valeria Méndez",
      customerPhone: "+54 9 299 577-4422",
      planTitle: "1 Sesión Individual",
      planPrice: "$35.000",
      totalAmount: 35000,
      amountPaid: 35000,
      paymentMethod: "efectivo",
      paymentStatus: "pagado_efectivo",
      date: threeDaysAgoStr,
      time: "19:00",
      customerNotes: "Sesión de prueba de 60 min completada.",
      internalNotes: "Interesada en continuar sesiones periódicas.",
      tags: ["Primera Vez", "Realizado"],
      status: "realizado",
      totalSessions: 1,
      sessionsCompleted: 1,
    },
  ];
}

export function generateSampleClinicalProfiles(): Record<
  string,
  StudentClinicalProfile
> {
  const todayStr = new Date().toISOString().split("T")[0];
  const lastWeekStr = new Date(Date.now() - 86400000 * 7)
    .toISOString()
    .split("T")[0];
  const twoWeeksAgoStr = new Date(Date.now() - 86400000 * 14)
    .toISOString()
    .split("T")[0];

  return {
    "+54 9 299 458-1290": {
      conditionReason: "Lumbalgia L5-S1 por sedentarismo laboral",
      painLevelInitial: 7,
      painLevelCurrent: 5,
      medicalNotes: "Sin cirugías previas. Responde bien a elongación axial.",
      tags: ["Lumbalgia", "Oficina"],
      evolutionLogs: [
        {
          date: todayStr,
          sessionNumber: 1,
          painBefore: 7,
          painAfter: 4,
          tensionLevel: "Moderada",
          notes: "Primera toma de contacto. Descompresión lumbar efectiva.",
        },
      ],
    },
    "+54 9 299 512-8844": {
      conditionReason: "Cervicobraquialgia y sobrecarga trapecio",
      painLevelInitial: 8,
      painLevelCurrent: 3,
      medicalNotes: "Deportista de alto impacto. Tensión miofascial alta.",
      tags: ["Cervicalgia", "Deportista"],
      evolutionLogs: [
        {
          date: todayStr,
          sessionNumber: 1,
          painBefore: 8,
          painAfter: 3,
          tensionLevel: "Alta",
          notes:
            "Liberación de cadenas escapulares y estiramiento de pectorales.",
        },
      ],
    },
    "+54 9 299 411-7320": {
      conditionReason: "Escoliosis leve y rectificación cervical",
      painLevelInitial: 6,
      painLevelCurrent: 2,
      medicalNotes: "Realizando Pack de 12 sesiones de reeducación postural.",
      tags: ["Postura", "Pack 12"],
      evolutionLogs: [
        {
          date: twoWeeksAgoStr,
          sessionNumber: 1,
          painBefore: 6,
          painAfter: 3,
          tensionLevel: "Moderada",
          notes: "Inicio de protocolo de descompresión simétrica.",
        },
        {
          date: lastWeekStr,
          sessionNumber: 2,
          painBefore: 5,
          painAfter: 2,
          tensionLevel: "Leve",
          notes: "Mejora en simetría de hombros y movilidad torácica.",
        },
      ],
    },
    "+54 9 299 402-9911": {
      conditionReason: "Hernia discal L4-L5 diagnosticada por resonancia",
      painLevelInitial: 9,
      painLevelCurrent: 2,
      medicalNotes: "Pack 8 finalizado con éxito. Alivio total de ciática.",
      tags: ["Hernia Discal", "Pack 8"],
      evolutionLogs: [
        {
          date: twoWeeksAgoStr,
          sessionNumber: 1,
          painBefore: 9,
          painAfter: 5,
          tensionLevel: "Muy Alta",
          notes: "Tracción suave gradual de 4 puntos.",
        },
        {
          date: lastWeekStr,
          sessionNumber: 4,
          painBefore: 5,
          painAfter: 2,
          tensionLevel: "Moderada",
          notes: "Descompresión total de raíz nerviosa L5.",
        },
        {
          date: todayStr,
          sessionNumber: 8,
          painBefore: 3,
          painAfter: 1,
          tensionLevel: "Leve",
          notes: "Finalización de pack. Dolor residual mínimo (1/10).",
        },
      ],
    },
  };
}

export function formatDateTimeExact(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month} a las ${hours}:${minutes} hs`;
  } catch {
    return "";
  }
}

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Recién";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return "";
  } catch {
    return "";
  }
}

// booking.date is a local YYYY-MM-DD wall-clock date (see formatDateISO in
// availability.ts), so this compares it against local today/tomorrow the
// same way instead of going through toISOString (which is UTC and used to
// say "mañana" for a booking that was actually today, in the evening in
// ART/UTC-3).
export function relativeDayLabel(bookingDate: string): string {
  const localISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (bookingDate === localISO(now)) return "hoy";
  if (bookingDate === localISO(tomorrow)) return "mañana";

  const [y, m, d] = bookingDate.split("-").map(Number);
  if (y && m && d) {
    return `el ${new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`;
  }
  return `el ${bookingDate}`;
}

export function parsePriceToNumber(priceStr: string): number {
  if (!priceStr) return 0;
  const digits = priceStr.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export type QuickWhatsAppMessageType =
  | "confirmar"
  | "recordatorio"
  | "reagendar"
  | "seguimiento_post"
  | "pago"
  | "ubicacion"
  | "renovacion"
  | "resena";

export function interpolateMessageTemplate(
  template: string,
  variables: Record<string, string | number | undefined>,
): string {
  let result = template;
  for (const [key, val] of Object.entries(variables)) {
    const stringVal = val !== undefined && val !== null ? String(val) : "";
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), stringVal);
  }
  return result;
}

// Raw message text, so the admin UI can show it in an editable textarea
// before opening WhatsApp — see buildQuickWhatsAppMessage below for the
// wa.me link built from the (possibly edited) text.
export function buildQuickWhatsAppText(
  type: QuickWhatsAppMessageType,
  booking: Booking,
  bankConfig?: BankConfig,
  templates?: MessageTemplatesConfig,
): string {
  const bank = bankConfig || DEFAULT_BANK_CONFIG;

  if (type === "resena") {
    return buildGoogleReviewWhatsAppText(booking.customerName, templates);
  }

  if (templates && templates[type]) {
    let bankLines = "";
    if (bank.cbu) bankLines += `🔢 *CBU:* ${bank.cbu}\n`;
    if (bank.titular) bankLines += `👤 *Titular:* ${bank.titular}\n`;
    if (bank.banco) bankLines += `🏦 *Banco:* ${bank.banco}\n`;

    const vars: Record<string, string> = {
      nombre: booking.customerName.trim(),
      plan: booking.planTitle,
      fecha: booking.date,
      hora: booking.time,
      dia_relativo: relativeDayLabel(booking.date),
      monto: booking.planPrice,
      alias: bank.alias || "PRAVILO.ARG",
      cbu: bank.cbu || "",
      titular: bank.titular || "",
      banco: bank.banco || "",
      datos_bancarios: bankLines,
      ubicacion: LOCATION,
      maps_url: GOOGLE_MAPS_URL,
      review_url: GOOGLE_WRITE_REVIEW_URL,
    };
    return interpolateMessageTemplate(templates[type], vars);
  }

  let text = "";

  if (type === "confirmar") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 Te escribo de *PRAVILO ARG* para confirmarte tu turno:\n\n`;
    text += `📋 *Plan:* ${booking.planTitle}\n`;
    text += `📅 *Día:* ${booking.date}\n`;
    text += `⏰ *Horario:* ${booking.time} hs\n`;
    text += `📍 *Ubicación:* Plottier, Neuquén\n\n`;
    text += `¡Tu sesión quedó confirmada! Te recomendamos venir con ropa cómoda deportiva. ¡Te esperamos! 🙌`;
  } else if (type === "recordatorio") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 Te recordamos tu sesión de *PRAVILO ARG* programada para ${relativeDayLabel(booking.date)} a las *${booking.time} hs*.\n\n`;
    text += `Recordá asistir con ropa deportiva cómoda e hidratarte bien. ¡Nos vemos en el estudio! 🧘‍♂️`;
  } else if (type === "reagendar") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 Te escribo de *PRAVILO ARG* con respecto a tu turno del ${booking.date} a las ${booking.time} hs.\n\n`;
    text += `¿Tendrías disponibilidad para coordinar un nuevo día u horario? ¡Avisame y lo acomodamos!`;
  } else if (type === "seguimiento_post") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 ¿Cómo amaneció tu cuerpo hoy después de la sesión de PRAVILO?\n\n`;
    text += `Recordá tomar bastante agua hoy para acompañar la hidratación fascial y no dudes en avisarme si tenés alguna duda o consulta. ¡Te esperamos pronto en el estudio! 🙌`;
  } else if (type === "pago") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 Te paso los datos bancarios para abonar tu sesión/pack de *PRAVILO ARG*:\n\n`;
    text += `💰 *Monto:* ${booking.planPrice}\n`;
    text += `💳 *Alias:* ${bank.alias || "PRAVILO.ARG"}\n`;
    if (bank.cbu) text += `🔢 *CBU:* ${bank.cbu}\n`;
    if (bank.titular) text += `👤 *Titular:* ${bank.titular}\n`;
    if (bank.banco) text += `🏦 *Banco:* ${bank.banco}\n\n`;
    text += `Una vez realizada la transferencia, envianos el comprobante por acá para registrarlo. ¡Muchas gracias! 🙌`;
  } else if (type === "ubicacion") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 Te comparto la ubicación y referencias para llegar al estudio de *PRAVILO ARG* en Plottier:\n\n`;
    text += `📍 *Dirección:* ${LOCATION}\n`;
    text += `🗺️ *Google Maps:* ${GOOGLE_MAPS_URL}\n\n`;
    text += `Cualquier duda al llegar, avisanos por este medio. ¡Buen viaje! 🚗`;
  } else if (type === "renovacion") {
    text = `¡Hola ${booking.customerName.trim()}! 👋 ¡Felicitaciones por el avance logrado en tus sesiones de PRAVILO! 🌟\n\n`;
    text += `Estás completando tu pack actual. Si querés renovar para el próximo mes y asegurar tu cupo y horarios habituales, avisame y te reservo tu lugar con la tarifa del pack. ¡Seguimos trabajando en tu movilidad! 🙌`;
  }

  return text;
}

export function buildQuickWhatsAppMessage(
  type: QuickWhatsAppMessageType,
  booking: Booking,
  bankConfig?: BankConfig,
  templates?: MessageTemplatesConfig,
): string {
  const cleanPhone = (booking.customerPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  return buildWhatsAppUrl(
    cleanPhone,
    buildQuickWhatsAppText(type, booking, bankConfig, templates),
  );
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildReceiptWhatsAppText(
  booking: Booking,
  bankConfig?: BankConfig,
  templates?: MessageTemplatesConfig,
): string {
  const bank = bankConfig || DEFAULT_BANK_CONFIG;
  const total = booking.totalAmount || parsePriceToNumber(booking.planPrice);
  const paid =
    booking.amountPaid ||
    (booking.paymentStatus?.startsWith("pagado") ? total : 0);
  const pending = Math.max(0, total - paid);

  if (templates?.comprobante) {
    let pendingSection = "";
    if (pending > 0) {
      pendingSection += `💳 *Datos para transferir el saldo:*\n`;
      pendingSection += `• *Alias:* ${bank.alias || "PRAVILO.ARG"}\n`;
      if (bank.cbu) pendingSection += `• *CBU:* ${bank.cbu}\n`;
      if (bank.titular) pendingSection += `• *Titular:* ${bank.titular}\n`;
      if (bank.banco) pendingSection += `• *Banco:* ${bank.banco}\n\n`;
      pendingSection += `_El saldo también puede abonarse en efectivo o transferencia el día de la sesión._\n\n`;
    } else {
      pendingSection += `✨ *¡Plan abonado al 100%!* Muchas gracias por tu compromiso. 🙌\n\n`;
    }

    return interpolateMessageTemplate(templates.comprobante, {
      nombre: booking.customerName.trim(),
      plan: booking.planTitle,
      fecha: booking.date,
      hora: booking.time,
      total: `$${total.toLocaleString("es-AR")}`,
      abonado: `$${paid.toLocaleString("es-AR")}`,
      saldo: `$${pending.toLocaleString("es-AR")}`,
      alias: bank.alias || "PRAVILO.ARG",
      cbu: bank.cbu || "",
      titular: bank.titular || "",
      banco: bank.banco || "",
      detalle_pago_saldo: pendingSection,
      ubicacion: LOCATION,
    });
  }

  let text = `🧾 *COMPROBANTE / DETALLE DE PAGO - PRAVILO ARG*\n\n`;
  text += `👤 *Alumno:* ${booking.customerName.trim()}\n`;
  text += `📋 *Plan/Servicio:* ${booking.planTitle}\n`;
  text += `📅 *Turno:* ${booking.date} - ${booking.time} hs\n`;
  text += `──────────────────\n`;
  text += `💰 *Total del Plan:* $${total.toLocaleString("es-AR")}\n`;
  text += `✅ *Abonado / Seña:* $${paid.toLocaleString("es-AR")}\n`;
  text += `⏳ *Saldo Pendiente:* $${pending.toLocaleString("es-AR")}\n`;
  text += `──────────────────\n\n`;

  if (pending > 0) {
    text += `💳 *Datos para transferir el saldo:*\n`;
    text += `• *Alias:* ${bank.alias || "PRAVILO.ARG"}\n`;
    if (bank.cbu) text += `• *CBU:* ${bank.cbu}\n`;
    if (bank.titular) text += `• *Titular:* ${bank.titular}\n`;
    if (bank.banco) text += `• *Banco:* ${bank.banco}\n\n`;
    text += `_El saldo también puede abonarse en efectivo o transferencia el día de la sesión._\n\n`;
  } else {
    text += `✨ *¡Plan abonado al 100%!* Muchas gracias por tu compromiso. 🙌\n\n`;
  }

  text += `📍 Estudio PRAVILO: Plottier, Neuquén.`;
  return text;
}

export function buildReceiptWhatsAppMessage(
  booking: Booking,
  bankConfig?: BankConfig,
  templates?: MessageTemplatesConfig,
): string {
  const cleanPhone = (booking.customerPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  return buildWhatsAppUrl(
    cleanPhone,
    buildReceiptWhatsAppText(booking, bankConfig, templates),
  );
}

export function buildReactivationWhatsAppText(
  customerName: string,
  lastDate?: string,
  templates?: MessageTemplatesConfig,
): string {
  if (templates?.reactivacion) {
    return interpolateMessageTemplate(templates.reactivacion, {
      nombre: customerName.trim(),
      fecha_ultima: lastDate || "",
      texto_ultima_fecha: lastDate
        ? `Vi que tu última sesión fue el ${lastDate}. ¿Cómo te venís sintiendo de la espalda y movilidad en estos días?\n\n`
        : "",
    });
  }

  let text = `¡Hola ${customerName.trim()}! 👋 Te escribo desde *PRAVILO ARG* en Plottier.\n\n`;
  if (lastDate) {
    text += `Vi que tu última sesión fue el ${lastDate}. ¿Cómo te venís sintiendo de la espalda y movilidad en estos días?\n\n`;
  } else {
    text += `¿Cómo te venís sintiendo con tu postura y movilidad?\n\n`;
  }
  text += `Te escribo para ver si te gustaría agendar una nueva sesión esta semana para continuar liberando tensión fascial y descomprimir la columna. ¡Avisame y coordinamos! 🙌`;

  return text;
}

export function buildReactivationWhatsAppMessage(
  customerName: string,
  customerPhone: string,
  lastDate?: string,
  templates?: MessageTemplatesConfig,
): string {
  const cleanPhone = (customerPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  return buildWhatsAppUrl(
    cleanPhone,
    buildReactivationWhatsAppText(customerName, lastDate, templates),
  );
}

export function buildGoogleCalendarUrl(booking: Booking): string {
  if (!booking.date || !booking.time) return "";
  try {
    const [year, month, day] = booking.date.split("-").map(Number);
    const [hour, min] = booking.time.split(":").map(Number);

    const startDate = new Date(year, month - 1, day, hour, min, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatCalDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, "");

    const title = `Sesión PRAVILO: ${booking.customerName} (${booking.planTitle})`;
    const details = `Alumno: ${booking.customerName}\nTeléfono: ${booking.customerPhone || "No especificado"}\nPlan: ${booking.planTitle} (${booking.planPrice})\nNotas: ${booking.customerNotes || "Ninguna"}`;
    const location = "PRAVILO ARG, Plottier, Neuquén";

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title,
    )}&dates=${formatCalDate(startDate)}/${formatCalDate(endDate)}&details=${encodeURIComponent(
      details,
    )}&location=${encodeURIComponent(location)}`;
  } catch {
    return "";
  }
}

export function exportBookingsToCSV(bookings: Booking[]): void {
  if (!bookings || bookings.length === 0) return;

  const headers = [
    "Fecha Solicitud",
    "Nombre Alumno",
    "Telefono",
    "Plan",
    "Precio",
    "Fecha Turno",
    "Horario",
    "Estado Turno",
    "Estado Pago",
    "Comentarios Cliente",
    "Notas Instructor",
  ];

  const rows = bookings.map((b) => [
    formatDateTimeExact(b.createdAt),
    `"${(b.customerName || "").replace(/"/g, '""')}"`,
    `"${b.customerPhone || ""}"`,
    `"${(b.planTitle || "").replace(/"/g, '""')}"`,
    `"${b.planPrice || ""}"`,
    b.date,
    b.time,
    b.status,
    b.paymentStatus || "pendiente",
    `"${(b.customerNotes || "").replace(/"/g, '""')}"`,
    `"${(b.internalNotes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `pravilo_reservas_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStudentsToCSV(
  students: {
    name: string;
    phone: string;
    lastDate: string;
    plan: string;
    totalSessions?: number;
    sessionsCompleted?: number;
    profile?: StudentClinicalProfile;
  }[],
): void {
  if (!students || students.length === 0) return;

  const headers = [
    "Nombre Alumno",
    "Telefono",
    "Ultima Sesion",
    "Plan Actual",
    "Sesiones Hechas",
    "Motivo Consulta",
    "Dolor Inicial (EVA)",
    "Dolor Actual (EVA)",
    "Consentimiento Firmado",
    "Observaciones Medicas",
  ];

  const rows = students.map((s) => [
    `"${(s.name || "").replace(/"/g, '""')}"`,
    `"${s.phone || ""}"`,
    s.lastDate,
    `"${(s.plan || "").replace(/"/g, '""')}"`,
    `${s.sessionsCompleted || 0}/${s.totalSessions || 1}`,
    `"${(s.profile?.conditionReason || "").replace(/"/g, '""')}"`,
    s.profile?.painLevelInitial ?? "",
    s.profile?.painLevelCurrent ?? "",
    s.profile?.hasSignedConsent ? "SI" : "NO",
    `"${(s.profile?.medicalNotes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `pravilo_alumnos_crm_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function buildGoogleReviewWhatsAppText(
  customerName: string,
  templates?: MessageTemplatesConfig,
): string {
  if (templates?.resena) {
    return interpolateMessageTemplate(templates.resena, {
      nombre: customerName.trim(),
      review_url: GOOGLE_WRITE_REVIEW_URL,
      maps_url: GOOGLE_MAPS_URL,
      ubicacion: LOCATION,
    });
  }

  let text = `¡Hola ${customerName.trim()}! 👋 Te escribo de *PRAVILO ARG*.\n\n`;
  text += `Queríamos agradecerte por confiar en nosotros para tu entrenamiento y descompresión corporal. 🧘‍♂️✨\n\n`;
  text += `¿Nos ayudarías dejando una breve reseña en Google sobre tu experiencia? Nos ayuda muchísimo a que más personas descubran los beneficios del método Pravilo en Neuquén:\n\n`;
  text += `⭐ *Dejar Reseña en Google:* ${GOOGLE_WRITE_REVIEW_URL}\n\n`;
  text += `¡Muchas gracias por tu apoyo y nos vemos en la próxima sesión! 🙌`;
  return text;
}

export function buildGoogleReviewWhatsAppMessage(
  customerName: string,
  customerPhone: string,
  templates?: MessageTemplatesConfig,
): string {
  const cleanPhone = (customerPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  return buildWhatsAppUrl(
    cleanPhone,
    buildGoogleReviewWhatsAppText(customerName, templates),
  );
}

export function buildGiftCardShareWhatsAppText(
  giftCard: GiftCard,
  templates?: MessageTemplatesConfig,
): string {
  if (templates?.giftcard) {
    return interpolateMessageTemplate(templates.giftcard, {
      destinatario: giftCard.recipientName,
      remitente: giftCard.senderName,
      plan: giftCard.planTitle,
      monto: giftCard.price,
      codigo: giftCard.code,
      mensaje_personalizado: giftCard.customMessage
        ? `💌 *Mensaje:* "${giftCard.customMessage}"\n`
        : "",
      ubicacion: LOCATION,
      maps_url: GOOGLE_MAPS_URL,
    });
  }

  let text = `🎁 *¡VOUCHER / GIFT CARD DIGITAL PRAVILO ARG!* 🌟\n\n`;
  text += `👤 *Para:* ${giftCard.recipientName}\n`;
  text += `🤝 *De parte de:* ${giftCard.senderName}\n`;
  text += `📋 *Experiencia:* ${giftCard.planTitle} (${giftCard.price})\n`;
  text += `🎟️ *Código de Canje:* \`${giftCard.code}\`\n`;
  if (giftCard.customMessage) {
    text += `💌 *Mensaje:* "${giftCard.customMessage}"\n`;
  }
  text += `\n──────────────────\n`;
  text += `📍 *Ubicación:* Plottier, Neuquén\n`;
  text += `📲 Para coordinar día y horario, respondé a este mensaje mencionando tu código de canje.\n`;
  text += `¡Que disfrutes tu sesión de descompresión y bienestar! 🙌`;
  return text;
}

export function buildGiftCardShareWhatsAppMessage(
  giftCard: GiftCard,
  phone?: string,
  templates?: MessageTemplatesConfig,
): string {
  const cleanPhone = (
    phone ||
    giftCard.recipientPhone ||
    giftCard.senderPhone ||
    ""
  ).replace(/\D/g, "");

  if (!cleanPhone) return "";
  return buildWhatsAppUrl(
    cleanPhone,
    buildGiftCardShareWhatsAppText(giftCard, templates),
  );
}

export function downloadFullJSONBackup(data: {
  bookings: Booking[];
  config: unknown;
  planPrices: unknown;
  bankConfig: BankConfig;
  clinicalProfiles: Record<string, StudentClinicalProfile>;
  giftCards?: GiftCard[];
}): void {
  const jsonStr = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: "2.1",
      ...data,
    },
    null,
    2,
  );

  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup_pravilo_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
