"use client";

import React, { useState, useMemo } from "react";
import {
  Booking,
  MessageTemplatesConfig,
  buildGoogleReviewWhatsAppText,
} from "@/lib/bookings";
import { GOOGLE_WRITE_REVIEW_URL } from "@/lib/constants";
import { CopyIcon } from "./Icons";
import { WhatsAppDraft, WhatsAppSendModal } from "./WhatsAppSendModal";

interface FidelizacionTabProps {
  bookings: Booking[];
  messageTemplates?: MessageTemplatesConfig;
}

export function FidelizacionTab({
  bookings,
  messageTemplates,
}: FidelizacionTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [waDraft, setWaDraft] = useState<WhatsAppDraft | null>(null);

  const googleMapsReviewUrl = GOOGLE_WRITE_REVIEW_URL;

  // Group unique students who completed at least 1 session
  const completedStudents = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        completedCount: number;
        lastDate: string;
        plan: string;
      }
    >();

    bookings.forEach((b) => {
      if (b.status !== "realizado" || !b.customerPhone) return;
      const key = b.customerPhone.trim();
      const existing = map.get(key) || {
        name: b.customerName,
        phone: b.customerPhone,
        completedCount: 0,
        lastDate: b.date,
        plan: b.planTitle,
      };

      existing.completedCount += 1;
      if (b.date > existing.lastDate) {
        existing.lastDate = b.date;
        existing.plan = b.planTitle;
      }
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) =>
      b.lastDate.localeCompare(a.lastDate),
    );
  }, [bookings]);

  const filteredStudents = completedStudents.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(googleMapsReviewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Google Review Booster */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-accent/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">⭐⭐⭐⭐⭐</span>
              <span className="text-xs font-condensed font-bold uppercase tracking-wider text-accent-text">
                Módulo de Reseñas de Google Maps
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-condensed uppercase tracking-tight text-foreground">
              Multiplicá la reputación y confianza de PRAVILO ARG
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-sans">
              Solicitá reseñas de 5 estrellas a tus alumnos tras completar sus
              sesiones o packs. Los testimonios verificados aumentan las
              reservas orgánicas en Neuquén y Plottier.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href={googleMapsReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shiny w-full sm:w-auto px-6 py-3.5 rounded-full bg-accent text-accent-foreground font-condensed font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/25 hover:opacity-95 transition-all"
            >
              <span>Ver Perfil de Google Maps ↗</span>
            </a>
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-surface-raised hover:bg-surface border border-border text-xs font-condensed font-bold uppercase tracking-wider text-foreground flex items-center justify-center gap-2 transition-all"
            >
              {copiedLink ? (
                "✓ Link Copiado"
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" /> Copiar Link de Reseña
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* List of candidates for review */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-black font-condensed uppercase text-foreground">
              Alumnos con Sesiones Realizadas ({completedStudents.length})
            </h4>
            <p className="text-xs text-muted">
              Hacé clic en &ldquo;Pedir Reseña&rdquo; para enviar un mensaje
              directo y personalizado por WhatsApp.
            </p>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar alumno..."
            className="px-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-foreground placeholder-muted/50 focus:border-accent focus:outline-none w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-muted text-center py-12 italic">
              No hay alumnos con sesiones finalizadas que coincidan con la
              búsqueda.
            </p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted font-condensed uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Alumno</th>
                  <th className="py-3 px-3">Teléfono</th>
                  <th className="py-3 px-3">Sesiones Completadas</th>
                  <th className="py-3 px-3">Último Plan</th>
                  <th className="py-3 px-3">Última Fecha</th>
                  <th className="py-3 px-3 text-right">Acción WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.phone}
                    className="hover:bg-surface-raised transition-colors"
                  >
                      <td className="py-3.5 px-3 font-condensed font-bold uppercase text-foreground text-sm">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-muted">
                        {s.phone}
                      </td>
                      <td className="py-3.5 px-3 font-condensed font-bold text-accent-text">
                        {s.completedCount} sesión
                        {s.completedCount !== 1 ? "es" : ""}
                      </td>
                      <td className="py-3.5 px-3 font-condensed uppercase text-foreground/90">
                        {s.plan}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-muted">
                        {s.lastDate}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setWaDraft({
                              phone: s.phone,
                              title: "⭐ Pedir Reseña en Google",
                              text: buildGoogleReviewWhatsAppText(
                                s.name,
                                messageTemplates,
                              ),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-condensed font-bold uppercase tracking-wider text-xs transition-all shadow cursor-pointer"
                        >
                          <span>💬 Pedir Reseña</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <WhatsAppSendModal draft={waDraft} onClose={() => setWaDraft(null)} />
    </div>
  );
}
