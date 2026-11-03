"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { PLANES } from "@/lib/plans";
import BenefitIcon from "./BenefitIcon";

export default function GiftCardModal() {
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(PLANES[0].title);
  const [customMessage, setCustomMessage] = useState("");

  const handleSendGift = () => {
    if (!recipientName.trim() || !senderName.trim()) return;

    let text = `¡Hola Juan! Quiero encargar una *Gift Card / Tarjeta de Regalo PRAVILO*:\n\n`;
    text += `*Para:* ${recipientName.trim()}\n`;
    text += `*De parte de:* ${senderName.trim()}\n`;
    text += `*Experiencia:* ${selectedPlan}\n`;
    if (customMessage.trim()) {
      text += `*Dedicatoria:* "${customMessage.trim()}"\n`;
    }
    text += `\n¿Cómo coordinamos el pago y la entrega del voucher digital? ¡Muchas gracias!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-line px-5 py-3 text-xs text-ink"
      >
        <BenefitIcon name="gift" className="h-4 w-4" />
        <span>Regalar una sesión</span>
      </button>

      {open &&
        createPortal(
          <div className="theme-light fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 max-h-[92svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl sm:p-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-raised text-muted hover:border-accent hover:text-foreground transition-colors"
              >
                &times;
              </button>

              <div className="pr-12">
                <span className="font-condensed text-xs font-bold uppercase tracking-wider text-accent-text">
                  Voucher digital
                </span>
                <h3 className="mt-1 text-3xl uppercase leading-none text-foreground [font-family:var(--font-anton)]">
                  Regalá una sesión
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Una sesión de PRAVILO con dedicatoria personalizada, para un
                  cumpleaños o una fecha especial.
                </p>
              </div>

              <div className="mt-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    ¿Para quién es el regalo? *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ej: Laura Martínez"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    Tu nombre (quien regala) *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ej: Martín Gómez"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    Experiencia a regalar
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-colors"
                  >
                    {PLANES.map((p) => (
                      <option key={p.title} value={p.title}>
                        {p.title} ({p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    Dedicatoria personalizada (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="¡Feliz cumpleaños! Que disfrutes esta sesión..."
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border bg-surface-raised px-4 py-2 font-condensed text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!recipientName.trim() || !senderName.trim()}
                  onClick={handleSendGift}
                  className="btn-shiny rounded-full bg-accent px-6 py-2.5 font-condensed text-sm font-bold text-accent-foreground shadow-md transition-all hover:opacity-95 disabled:opacity-30"
                >
                  Encargar Voucher por WhatsApp →
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
