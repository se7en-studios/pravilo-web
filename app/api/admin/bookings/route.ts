import { NextRequest, NextResponse } from "next/server";
import {
  Booking,
  PaymentMethod,
  PaymentStatus,
  generateSampleBookings,
} from "@/lib/bookings";
import {
  getDBBookings,
  saveDBBookings,
  upsertDBBooking,
  deleteDBBooking,
} from "@/lib/cloudStorage";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKING_STATUSES: Booking["status"][] = ["pendiente", "confirmado", "realizado", "cancelado"];
const PAYMENT_STATUSES: PaymentStatus[] = ["pendiente", "seña", "pagado_efectivo", "pagado_transferencia", "pagado_mp"];
const PAYMENT_METHODS: PaymentMethod[] = ["efectivo", "transferencia", "mercadopago", "otro"];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function unauthorized() {
  return json({ ok: false, error: "No autorizado. Volvé a iniciar sesión en el panel." }, 401);
}

function cleanStr(value: unknown, maxLen: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLen) : "";
}

function cleanAmount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return Math.round(value);
}

function cleanTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tags = value
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 12);
  return tags.length > 0 ? tags : undefined;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  // El listado completo incluye datos personales de clientes: solo admin.
  if (!isAdminRequest(req)) return unauthorized();

  try {
    const bookings = await getDBBookings();
    return json({ ok: true, bookings });
  } catch (err: unknown) {
    return json(
      { ok: false, error: err instanceof Error ? err.message : "Error al leer turnos" },
      500,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ ok: false, error: "Cuerpo de la petición inválido." }, 400);
    }

    const isAdmin = isAdminRequest(req);

    // --- Restaurar turnos de muestra (solo admin) ---
    if (body.resetWithSamples) {
      if (!isAdmin) return unauthorized();
      const samples = generateSampleBookings();
      const saved = await saveDBBookings(samples);
      if (!saved) {
        return json({ ok: false, error: "No se pudieron guardar los turnos de ejemplo" }, 500);
      }
      return json({ ok: true, bookings: samples });
    }

    // --- Restaurar backup completo (solo admin) ---
    if (body.importAllBookings && Array.isArray(body.importAllBookings)) {
      if (!isAdmin) return unauthorized();
      const restored: Booking[] = [];
      let skipped = 0;
      for (const item of body.importAllBookings as unknown[]) {
        if (
          item &&
          typeof item === "object" &&
          typeof (item as Booking).id === "string" &&
          typeof (item as Booking).customerName === "string" &&
          typeof (item as Booking).date === "string" &&
          typeof (item as Booking).time === "string"
        ) {
          restored.push(item as Booking);
        } else {
          skipped++;
        }
      }
      const saved = await saveDBBookings(restored);
      if (!saved) {
        return json({ ok: false, error: "No se pudo importar el respaldo" }, 500);
      }
      return json({ ok: true, bookings: restored, skipped });
    }

    // --- Crear turno (wizard público o alta manual del admin) ---
    const customerName = cleanStr(body.customerName, 120);
    const date = cleanStr(body.date, 10);
    const time = cleanStr(body.time, 5);

    if (!customerName || !date || !time) {
      return json({ ok: false, error: "Faltan campos obligatorios (nombre, fecha y horario)." }, 400);
    }
    if (!DATE_RE.test(date)) {
      return json({ ok: false, error: "Formato de fecha inválido (se espera YYYY-MM-DD)." }, 400);
    }
    if (!TIME_RE.test(time)) {
      return json({ ok: false, error: "Formato de horario inválido (se espera HH:mm)." }, 400);
    }

    const planTitle = cleanStr(body.planTitle, 80) || "1 Sesión Individual";
    const planPrice = cleanStr(body.planPrice, 40) || "$35.000";
    const customerPhone = cleanStr(body.customerPhone, 40);
    const status: Booking["status"] = BOOKING_STATUSES.includes(body.status) ? body.status : "pendiente";
    const paymentStatus: PaymentStatus = PAYMENT_STATUSES.includes(body.paymentStatus)
      ? body.paymentStatus
      : "pendiente";
    const paymentMethod: PaymentMethod | undefined = PAYMENT_METHODS.includes(body.paymentMethod)
      ? body.paymentMethod
      : undefined;

    const currentBookings = await getDBBookings();

    // Duplicado exacto (mismo cliente, misma fecha y horario, turno activo): rechazar siempre.
    const exactDuplicate = currentBookings.some(
      (b) =>
        b.status !== "cancelado" &&
        b.date === date &&
        b.time === time &&
        normalizeName(b.customerName) === normalizeName(customerName) &&
        (b.customerPhone || "").trim() === customerPhone,
    );
    if (exactDuplicate) {
      return json(
        { ok: false, error: "Ya existe un turno idéntico para ese cliente en esa fecha y horario." },
        409,
      );
    }

    // Slot ocupado por otro turno activo: rechazar para el público; el admin puede sobreagendar.
    const slotTaken = currentBookings.some(
      (b) => b.status !== "cancelado" && b.date === date && b.time === time,
    );
    if (slotTaken && !isAdmin) {
      return json(
        { ok: false, error: "El horario seleccionado ya se encuentra ocupado. Elegí otro horario." },
        409,
      );
    }

    const totalSessions = planTitle.includes("8") ? 8 : planTitle.includes("12") ? 12 : 1;

    const newBooking: Booking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      planTitle,
      planPrice,
      totalAmount: cleanAmount(body.totalAmount),
      amountPaid: cleanAmount(body.amountPaid),
      paymentMethod,
      tags: cleanTags(body.tags),
      date,
      time,
      customerName,
      customerPhone,
      customerNotes: cleanStr(body.customerNotes, 2000),
      internalNotes: cleanStr(body.internalNotes, 2000),
      paymentStatus,
      sessionsCompleted: 0,
      totalSessions,
      status,
    };

    const saved = await upsertDBBooking(newBooking);
    if (!saved) {
      return json({ ok: false, error: "No se pudo guardar el turno" }, 500);
    }
    const updatedBookings = await getDBBookings();

    return json({ ok: true, booking: newBooking, bookings: updatedBookings });
  } catch (err: unknown) {
    console.error("[api/admin/bookings] POST error:", err);
    return json(
      { ok: false, error: err instanceof Error ? err.message : "Error al registrar turno" },
      500,
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    const id = body?.id;

    if (typeof id !== "string" || !id) {
      return json({ ok: false, error: "ID requerido" }, 400);
    }

    const currentBookings = await getDBBookings();
    const existing = currentBookings.find((b) => b.id === id);

    if (!existing) {
      return json({ ok: false, error: "El turno no existe (puede que ya haya sido eliminado)." }, 404);
    }

    const updates: Partial<Booking> = {};
    if (body.date !== undefined && DATE_RE.test(cleanStr(body.date, 10))) {
      updates.date = cleanStr(body.date, 10);
    }
    if (body.time !== undefined && TIME_RE.test(cleanStr(body.time, 5))) {
      updates.time = cleanStr(body.time, 5);
    }
    if (body.planTitle !== undefined) updates.planTitle = cleanStr(body.planTitle, 80) || existing.planTitle;
    if (body.planPrice !== undefined) updates.planPrice = cleanStr(body.planPrice, 40) || existing.planPrice;
    if (body.customerName !== undefined) {
      const name = cleanStr(body.customerName, 120);
      if (name) updates.customerName = name;
    }
    if (body.customerPhone !== undefined) updates.customerPhone = cleanStr(body.customerPhone, 40);
    if (body.customerNotes !== undefined) updates.customerNotes = cleanStr(body.customerNotes, 2000);
    if (body.internalNotes !== undefined) updates.internalNotes = cleanStr(body.internalNotes, 2000);
    if (body.status !== undefined && BOOKING_STATUSES.includes(body.status)) {
      updates.status = body.status;
    }
    if (body.paymentStatus !== undefined && PAYMENT_STATUSES.includes(body.paymentStatus)) {
      updates.paymentStatus = body.paymentStatus;
    }
    if (body.paymentMethod !== undefined && PAYMENT_METHODS.includes(body.paymentMethod)) {
      updates.paymentMethod = body.paymentMethod;
    }
    if (body.amountPaid !== undefined) updates.amountPaid = cleanAmount(body.amountPaid);
    if (body.totalAmount !== undefined) updates.totalAmount = cleanAmount(body.totalAmount);
    if (body.tags !== undefined) updates.tags = cleanTags(body.tags);
    if (body.sessionsCompleted !== undefined) {
      const v = cleanAmount(body.sessionsCompleted);
      if (v !== undefined) updates.sessionsCompleted = v;
    }
    if (body.totalSessions !== undefined) {
      const v = cleanAmount(body.totalSessions);
      if (v !== undefined) updates.totalSessions = v;
    }
    if (body.clinicalProfile !== undefined && typeof body.clinicalProfile === "object") {
      updates.clinicalProfile = body.clinicalProfile;
    }

    const updatedBooking: Booking = { ...existing, ...updates };

    const saved = await upsertDBBooking(updatedBooking);
    if (!saved) {
      return json({ ok: false, error: "No se pudo guardar el turno" }, 500);
    }
    const updatedBookings = await getDBBookings();

    return json({ ok: true, bookings: updatedBookings });
  } catch (err: unknown) {
    console.error("[api/admin/bookings] PATCH error:", err);
    return json({ ok: false, error: err instanceof Error ? err.message : "Error" }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return json({ ok: false, error: "ID requerido" }, 400);
    }

    const currentBookings = await getDBBookings();
    const exists = currentBookings.some((b) => b.id === id);
    if (!exists) {
      return json({ ok: false, error: "El turno no existe (puede que ya haya sido eliminado)." }, 404);
    }

    const deleted = await deleteDBBooking(id);
    if (!deleted) {
      return json({ ok: false, error: "No se pudo eliminar el turno" }, 500);
    }
    const updatedBookings = await getDBBookings();

    return json({ ok: true, bookings: updatedBookings });
  } catch (err: unknown) {
    console.error("[api/admin/bookings] DELETE error:", err);
    return json({ ok: false, error: err instanceof Error ? err.message : "Error" }, 500);
  }
}
