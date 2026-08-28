import Link from "next/link";
import { whatsappLink, LOCATION, WHATSAPP_NUMBER } from "@/lib/constants";
import { getDBBankConfig } from "@/lib/cloudStorage";
import { DEFAULT_BANK_CONFIG } from "@/lib/bookings";

export default async function ReservaConfirmada({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    price?: string;
    date?: string;
    time?: string;
    name?: string;
    phone?: string;
  }>;
}) {
  const params = await searchParams;
  // Falla de I/O transitoria en el storage → datos bancarios por defecto
  const bankConfig = await getDBBankConfig().catch(() => ({ ...DEFAULT_BANK_CONFIG }));
  const plan = params.plan || "1 Sesión Individual";
  const price = params.price || "$35.000";
  const date = params.date || "";
  const time = params.time || "";
  const name = params.name || "";

  // Build calendar link if date and time provided
  let googleCalUrl = "";
  if (date && time) {
    try {
      const [year, month, day] = date.split("-").map(Number);
      const [hour, min] = time.split(":").map(Number);
      const start = new Date(year, month - 1, day, hour, min, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

      const title = `Sesión PRAVILO ARG: ${plan}`;
      const details = `Turno confirmado en PRAVILO ARG (${LOCATION}). Plan: ${plan} (${price}).`;
      googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title,
      )}&dates=${formatCalDate(start)}/${formatCalDate(end)}&details=${encodeURIComponent(
        details,
      )}&location=${encodeURIComponent("PRAVILO ARG, Plottier, Neuquén")}`;
    } catch {
      // ignore
    }
  }

  let message = `¡Hola Juan! 👋`;
  if (name) message += ` Soy *${name.trim()}*.`;
  message += ` Reservé mi turno en PRAVILO ARG:\n\n`;
  message += `📋 *Plan:* ${plan} (${price})\n`;
  if (date) message += `📅 *Fecha:* ${date}\n`;
  if (time) message += `⏰ *Horario:* ${time} hs\n`;
  message += `\n¿Me confirmás la recepción del turno? ¡Muchas gracias!`;

  const mapLink = "https://maps.app.goo.gl/uL3Uqg6G1vYmQoVn6";

  return (
    <main className="grain relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 text-center overflow-hidden bg-background text-foreground">
      {/* Ambient Glow Carmesí */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[140px]"
      />

      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-border bg-surface-raised/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl text-left space-y-6">
        {/* Top Icon & Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/40 bg-accent/20 text-accent-text shadow-[0_0_30px_-5px_rgba(160,26,26,0.5)] animate-pulse">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <span className="eyebrow mx-auto w-fit">
            Reserva Solicitada con Éxito
          </span>

          <h1 className="font-condensed text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            {name ? `¡Excelente, ${name.split(" ")[0]}!` : "¡Tu sesión está por comenzar!"}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            Recibimos tu solicitud. A continuación encontrás todos los detalles de tu turno y los datos del estudio en Plottier.
          </p>
        </div>

        {/* Turn Summary Box */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 text-xs space-y-2.5 shadow-sm">
          <div className="flex justify-between items-center text-sm border-b border-border pb-2 font-condensed font-bold uppercase tracking-wider text-accent-text">
            <span>{plan}</span>
            <span className="font-mono">{price}</span>
          </div>
          {date && (
            <div className="flex justify-between items-center text-foreground/90 font-condensed text-sm">
              <span className="text-muted">Fecha:</span>
              <span className="font-bold text-foreground">{date}</span>
            </div>
          )}
          {time && (
            <div className="flex justify-between items-center text-foreground/90 font-condensed text-sm">
              <span className="text-muted">Horario:</span>
              <span className="font-bold text-accent-text">{time} hs</span>
            </div>
          )}
          {name && (
            <div className="flex justify-between items-center text-foreground/90 font-condensed text-sm">
              <span className="text-muted">Alumno/a:</span>
              <span className="font-medium text-foreground">{name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Calendar & WhatsApp */}
        <div className="space-y-3">
          {googleCalUrl && (
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-full border border-border-highlight bg-surface hover:border-accent hover:bg-surface-raised font-condensed text-sm font-bold uppercase tracking-wider text-foreground transition-all shadow"
            >
              <svg className="w-4 h-4 text-accent-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Agregar a Google Calendar</span>
            </a>
          )}

          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shiny flex items-center justify-center gap-2 w-full py-4 px-6 rounded-full bg-accent font-condensed text-base font-black uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/25 hover:opacity-95 active:scale-95 transition-all"
          >
            <span>Confirmar turno por WhatsApp</span>
            <span>→</span>
          </a>
        </div>

        {/* Bank details for deposit */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-condensed font-bold uppercase tracking-wider text-accent-text">
              💳 Datos para Seña o Transferencia
            </span>
            <span className="text-[10px] font-condensed uppercase tracking-wider text-muted">Estudio Oficial</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-background border border-border">
              <span className="text-muted block text-[10px]">Alias Bancario:</span>
              <span className="font-bold text-foreground select-all text-xs">{bankConfig.alias}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background border border-border">
              <span className="text-muted block text-[10px]">Titular:</span>
              <span className="text-foreground text-xs">{bankConfig.titular || bankConfig.accountHolder}</span>
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            Podés abonar la seña para asegurar tu slot y enviar el comprobante directamente al WhatsApp de Juan ({WHATSAPP_NUMBER}).
          </p>
        </div>

        {/* Location & Map */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-condensed font-bold uppercase tracking-wider text-foreground">
              📍 Cómo llegar al estudio
            </span>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-text font-condensed font-bold uppercase tracking-wider hover:underline text-xs flex items-center gap-1"
            >
              <span>Abrir Mapa</span>
              <span>↗</span>
            </a>
          </div>
          <p className="text-muted text-xs">
            {LOCATION} · Estudio privado climatizado con equipamiento oficial PRAVILO.
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs font-condensed uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            ← Volver al sitio principal
          </Link>
        </div>
      </div>
    </main>
  );
}
