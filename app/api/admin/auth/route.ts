import { NextRequest, NextResponse } from "next/server";
import { isPinThrottled, isValidAdminPin, registerFailedPinAttempt } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verifica el PIN del panel de administración. */
export async function POST(req: NextRequest) {
  try {
    if (isPinThrottled()) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos fallidos. Esperá unos minutos y volvé a intentar." },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }

    const body = await req.json().catch(() => null);
    const pin = body?.pin;

    if (!isValidAdminPin(pin)) {
      registerFailedPinAttempt();
      return NextResponse.json(
        { ok: false, error: "PIN incorrecto." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al verificar el PIN." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
