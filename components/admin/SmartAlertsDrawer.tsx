"use client";

import React, { useState } from "react";
import {
  BankConfig,
  Booking,
  MessageTemplatesConfig,
  buildQuickWhatsAppText,
  buildReceiptWhatsAppText,
} from "@/lib/bookings";
import { WhatsAppDraft, WhatsAppSendModal } from "./WhatsAppSendModal";

interface SmartAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  bankConfig: BankConfig;
  messageTemplates?: MessageTemplatesConfig;
  onSelectBooking: (id: string) => void;
  onUpdateStatus: (id: string, status: Booking["status"]) => void;
}

export function SmartAlertsDrawer({
  isOpen,
  onClose,
  bookings,
  bankConfig,
  messageTemplates,
  onSelectBooking,
  onUpdateStatus,
}: SmartAlertsDrawerProps) {
  const [waDraft, setWaDraft] = useState<WhatsAppDraft | null>(null);

  if (!isOpen) return null;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const yesterdayStr = new Date(now.getTime() - 86400000)
    .toISOString()
    .split("T")[0];

  // 1. Turnos de hoy que aún están pendientes de confirmación
  const pendingToday = bookings.filter(
    (b) => b.date === todayStr && b.status === "pendiente",
  );

  // 2. Turnos próximos con pago pendiente o solo seña
  const pendingPayments = bookings.filter(
    (b) =>
      b.date >= todayStr &&
      b.status !== "cancelado" &&
      (b.paymentStatus === "pendiente" || b.paymentStatus === "seña"),
  );

  // 3. Alumnos que completaron su pack y pueden renovar
  const packRenewals = bookings.filter(
    (b) =>
      (b.totalSessions || 1) > 1 &&
      (b.sessionsCompleted || 0) >= (b.totalSessions || 1) &&
      b.status !== "cancelado",
  );

  // 4. Turnos realizados ayer u hoy que ameritan mensaje de seguimiento post-sesión
  const followUps = bookings.filter(
    (b) =>
      (b.date === yesterdayStr || b.date === todayStr) &&
      b.status === "realizado" &&
      b.customerPhone,
  );

  const totalAlerts =
    pendingToday.length +
    pendingPayments.length +
    packRenewals.length +
    followUps.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface-raised">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-text">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black font-condensed uppercase tracking-tight text-foreground flex items-center gap-2">
                  Alertas Inteligentes
                  <span className="px-2 py-0.5 rounded-full text-xs font-condensed font-bold bg-accent text-accent-foreground">
                    {totalAlerts}
                  </span>
                </h3>
                <p className="text-xs text-muted font-sans">
                  Acciones prioritarias recomendadas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {totalAlerts === 0 ? (
              <div className="text-center py-12 text-muted space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-base font-bold font-condensed uppercase text-foreground">
                  ¡Todo al día!
                </p>
                <p className="text-xs max-w-xs mx-auto font-sans">
                  No tenés turnos pendientes ni pagos atrasados urgentes por
                  procesar hoy.
                </p>
              </div>
            ) : null}

            {/* 1. Turnos de hoy sin confirmar */}
            {pendingToday.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-condensed font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Turnos de Hoy Sin Confirmar ({pendingToday.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {pendingToday.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-rose-500/30 hover:border-rose-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-condensed font-bold uppercase text-foreground">
                            {b.customerName}
                          </p>
                          <p className="text-xs text-rose-300 font-mono">
                            Hoy a las {b.time} hs • {b.planTitle}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-condensed font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          Pendiente
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {b.customerPhone && (
                          <button
                            type="button"
                            onClick={() =>
                              setWaDraft({
                                phone: b.customerPhone,
                                title: "Confirmar Turno",
                                text: buildQuickWhatsAppText(
                                  "confirmar",
                                  b,
                                  bankConfig,
                                  messageTemplates,
                                ),
                              })
                            }
                            className="flex-1 text-center py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-condensed font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                            </svg>
                            Confirmar por WhatsApp
                          </button>
                        )}
                        <button
                          onClick={() => onUpdateStatus(b.id, "confirmado")}
                          className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-raised border border-border text-xs font-condensed font-bold uppercase text-foreground transition-colors"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Cobros o Señas Pendientes */}
            {pendingPayments.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-condensed font-bold uppercase tracking-wider text-accent-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Pagos / Señas Pendientes ({pendingPayments.length})
                </h4>
                <div className="space-y-2">
                  {pendingPayments.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-condensed font-bold uppercase text-foreground truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-accent-text font-mono">
                          {b.date} • {b.planPrice}
                        </p>
                      </div>
                      {b.customerPhone && (
                        <button
                          type="button"
                          onClick={() =>
                            setWaDraft({
                              phone: b.customerPhone,
                              title: "Datos de Pago",
                              text: buildReceiptWhatsAppText(
                                b,
                                bankConfig,
                                messageTemplates,
                              ),
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent-text text-xs font-condensed font-bold uppercase border border-accent/40 transition-all shrink-0"
                          title="Enviar datos de pago"
                        >
                          Cobrar WA
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Renovación de Packs */}
            {packRenewals.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-condensed font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Alumnos para Renovación ({packRenewals.length})
                </h4>
                <div className="space-y-2">
                  {packRenewals.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-condensed font-bold uppercase text-foreground truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-purple-300 font-condensed">
                          {b.sessionsCompleted}/{b.totalSessions} sesiones
                          completadas
                        </p>
                      </div>
                      {b.customerPhone && (
                        <button
                          type="button"
                          onClick={() =>
                            setWaDraft({
                              phone: b.customerPhone,
                              title: "Ofrecer Renovación Pack",
                              text: buildQuickWhatsAppText(
                                "renovacion",
                                b,
                                bankConfig,
                                messageTemplates,
                              ),
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-condensed font-bold uppercase border border-purple-500/30 transition-all shrink-0"
                        >
                          Ofrecer Pack
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Seguimiento Post-Sesión */}
            {followUps.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-condensed font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Seguimiento Post-Sesión ({followUps.length})
                </h4>
                <div className="space-y-2">
                  {followUps.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-condensed font-bold uppercase text-foreground truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-sky-300 font-condensed">
                          Sesión realizada ({b.date})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setWaDraft({
                            phone: b.customerPhone,
                            title: "Seguimiento Post-Sesión",
                            text: buildQuickWhatsAppText(
                              "seguimiento_post",
                              b,
                              bankConfig,
                              messageTemplates,
                            ),
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-condensed font-bold uppercase border border-sky-500/30 transition-all shrink-0"
                      >
                        ¿Cómo amaneció?
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <WhatsAppSendModal draft={waDraft} onClose={() => setWaDraft(null)} />
    </div>
  );
}
