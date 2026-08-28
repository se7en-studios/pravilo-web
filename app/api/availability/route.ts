import { NextResponse } from "next/server";
import { getDBBookings } from "@/lib/cloudStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fecha de hoy (YYYY-MM-DD) en horario argentino. */
function todayInArgentina(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Endpoint PÚBLICO de disponibilidad para el wizard de reservas.
 * Devuelve únicamente fecha/hora/estado de los turnos activos — nunca
 * datos personales de los clientes.
 */
export async function GET() {
  try {
    const today = todayInArgentina();
    const occupied = (await getDBBookings())
      .filter((b) => b.status !== "cancelado" && typeof b.date === "string" && b.date >= today)
      .map((b) => ({ date: b.date, time: b.time, status: b.status }));

    return NextResponse.json(
      { ok: true, occupied },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: unknown) {
    console.error("[api/availability] GET error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer la disponibilidad." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
