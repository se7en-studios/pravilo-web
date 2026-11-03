import Link from "next/link";
import Image from "next/image";
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

  const firstName = name ? name.trim().split(" ")[0] : "";

  return (
    <main className="min-h-screen bg-paper text-ink">
      {/* Banda roja con el saludo */}
      <section className="bg-accent px-5 pb-16 pt-6 text-white sm:px-6">
        <div className="mx-auto max-w-xl">
          <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Volver al inicio">
            <Image src="/images/logo-transparent.png" alt="PRAVILO ARG" width={900} height={176} className="h-7 w-auto" priority />
          </Link>
          <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-md bg-white text-accent">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="label mt-6 text-white/80">Reserva solicitada</p>
          <h1 className="display mt-2 text-[17vw] sm:text-8xl">
            {firstName ? `¡Listo, ${firstName}!` : "¡Turno pedido!"}
          </h1>
          <p className="mt-4 max-w-md text-lg font-medium text-white/90">
            Falta un paso: confirmalo por WhatsApp así Juan te lo reserva.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-xl space-y-4 px-5 pb-16 sm:px-6">
        {/* Resumen del turno */}
        <div className="rounded-md bg-white p-6 shadow-[0_20px_50px_-30px_rgba(18,23,33,0.4)]">
          <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-4">
            <span className="label text-accent">{plan}</span>
            <span className="display text-4xl">{price}</span>
          </div>
          <dl className="mt-4 space-y-3 text-base">
            {date && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Fecha</dt>
                <dd className="font-bold">{date}</dd>
              </div>
            )}
            {time && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Horario</dt>
                <dd className="font-bold">{time} hs</dd>
              </div>
            )}
            {name && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Alumno/a</dt>
                <dd className="font-bold">{name}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 space-y-2">
            <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="btn btn-red w-full">
              Confirmar por WhatsApp <span className="arrow">→</span>
            </a>
            {googleCalUrl && (
              <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line w-full">
                Agregar a Google Calendar
              </a>
            )}
          </div>
        </div>

        {/* Datos para la seña */}
        <div className="rounded-md bg-white p-6">
          <p className="label text-accent">Seña o transferencia</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-paper p-4">
              <p className="text-sm text-ink-soft">Alias</p>
              <p className="mt-1 select-all break-all text-lg font-bold">{bankConfig.alias}</p>
            </div>
            <div className="rounded-md bg-paper p-4">
              <p className="text-sm text-ink-soft">Titular</p>
              <p className="mt-1 text-lg font-bold">{bankConfig.titular || bankConfig.accountHolder}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Podés abonar la seña para asegurar tu horario y mandarle el
            comprobante a Juan por WhatsApp ({WHATSAPP_NUMBER}).
          </p>
        </div>

        {/* Cómo llegar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-white p-6">
          <div>
            <p className="label text-accent">Cómo llegar</p>
            <p className="mt-2 font-bold">{LOCATION}</p>
          </div>
          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="btn btn-line px-4 py-3 text-xs">
            Abrir mapa ↗
          </a>
        </div>

        <div className="pt-2 text-center">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-bold uppercase tracking-wider text-ink-soft hover:text-ink">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
