"use client";

import React, { useEffect, useState } from "react";
import BookingWizard from "./BookingWizard";
import GiftCardModal from "./GiftCardModal";
import { PLANES_EXPERIENCIA, Plan } from "@/lib/plans";
import { LOCAL_STORAGE_PRICES_KEY } from "@/lib/bookings";

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>(PLANES_EXPERIENCIA);

  useEffect(() => {
    const applyPrices = (parsed: Record<string, string | undefined>) => {
      if (parsed.individual) {
        const updated = PLANES_EXPERIENCIA.map((p) => {
          if (p.title.includes("Individual") && parsed.individual) {
            const num = parseInt(parsed.individual.replace(/\D/g, ""), 10) || p.priceNumber;
            return {
              ...p,
              price: parsed.individual,
              priceNumber: num,
              desc: parsed.individualDesc || p.desc,
            };
          }
          return p;
        });
        setPlans(updated);
      }
    };

    // 1. LocalStorage cache
    try {
      const stored =
        localStorage.getItem("pravilo_plan_prices") ||
        localStorage.getItem(LOCAL_STORAGE_PRICES_KEY);
      if (stored) {
        applyPrices(JSON.parse(stored));
      }
    } catch {}

    // 2. Fetch from server API
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.planPrices) {
          applyPrices(data.planPrices);
          localStorage.setItem("pravilo_plan_prices", JSON.stringify(data.planPrices));
        }
      })
      .catch(() => {});
  }, []);

  const plan = plans[0] || PLANES_EXPERIENCIA[0];

  return (
    <section id="precio" className="paper relative overflow-hidden px-5 py-20 sm:px-6 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-16">
        <div>
          <p className="label text-accent">Precio</p>
          <h2 data-split className="display mt-3 text-[17vw] sm:text-8xl md:text-9xl">
            Tu sesión,
            <br />
            todo incluido
          </h2>
          <p data-fade className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
            Uno a uno, guiada en todo momento por Juan en el aparato PRAVILO
            oficial. Sin grupos.
          </p>
        </div>

        <div data-fade className="min-w-0">
          <div className="rounded-md bg-accent p-7 text-white shadow-[0_30px_70px_-30px_rgba(160,26,26,0.7)] sm:p-9">
            <div className="label flex items-center justify-between gap-3 text-white/75">
              <span>{plan.title}</span>
              <span>60 min · 1 a 1</span>
            </div>
            <p className="display mt-5 text-[22vw] leading-none sm:text-8xl">{plan.price}</p>
            <p className="mt-2 text-sm text-white/75">{plan.desc}</p>

            <ul className="mt-7 space-y-3 border-t border-white/25 pt-7 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
                  </svg>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
            <BookingWizard
              buttonText={`Reservar · ${plan.price}`}
              className="btn btn-white mt-8 w-full"
            />
          </div>

          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-ink-soft">¿Para regalar? Voucher digital con dedicatoria.</p>
            <GiftCardModal />
          </div>
        </div>
      </div>
    </section>
  );
}
