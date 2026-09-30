"use client";

import React, { useState, useMemo } from "react";
import { ScheduleConfig, getAvailableSlots } from "@/lib/availability";
import {
  Booking,
  buildQuickWhatsAppText,
  BankConfig,
  MessageTemplatesConfig,
} from "@/lib/bookings";
import { WhatsAppDraft, WhatsAppSendModal } from "./WhatsAppSendModal";

interface AgendaCalendarTabProps {
  bookings: Booking[];
  config: ScheduleConfig;
  bankConfig?: BankConfig;
  messageTemplates?: MessageTemplatesConfig;
  onOpenManualBookingForDate: (date: string, slot?: string) => void;
  onSelectBooking: (id: string) => void;
  onEditBooking?: (booking: Booking) => void;
}

export function AgendaCalendarTab({
  bookings,
  config,
  bankConfig,
  messageTemplates,
  onOpenManualBookingForDate,
  onSelectBooking,
  onEditBooking,
}: AgendaCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [waDraft, setWaDraft] = useState<WhatsAppDraft | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split("T")[0],
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  // First day of month & total days
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Bookings mapped by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      if (!b.date) return;
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    });
    return map;
  }, [bookings]);

  // Selected date details
  const selectedDateObj = new Date(`${selectedDateStr}T12:00:00`);
  const selectedDayBookings = (bookingsByDate.get(selectedDateStr) || []).sort(
    (a, b) => a.time.localeCompare(b.time),
  );
  const isSelectedDateBlocked = (config.blockedDates || []).includes(
    selectedDateStr,
  );
  const blockedReason = config.blockedDateReasons?.[selectedDateStr];
  const configuredSlots = getAvailableSlots(selectedDateObj, config);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-black capitalize text-foreground font-condensed uppercase tracking-wider">
            {monthName}
          </h3>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs font-condensed font-bold uppercase text-foreground transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-foreground hover:text-accent-text transition-colors"
            title="Mes anterior"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-foreground hover:text-accent-text transition-colors"
            title="Mes siguiente"
          >
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid & Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Grid (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-surface border border-border space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-condensed font-bold text-xs text-muted uppercase tracking-wider">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots for month padding */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-16 sm:h-20 rounded-xl bg-transparent opacity-10"
              />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isSelected = selectedDateStr === dateStr;
              const dayBookings = bookingsByDate.get(dateStr) || [];
              const isBlocked = (config.blockedDates || []).includes(dateStr);
              const isToday =
                new Date().toISOString().split("T")[0] === dateStr;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? "bg-surface-raised border-accent text-accent-text shadow-lg shadow-accent/15"
                      : isBlocked
                        ? "bg-rose-500/[0.05] border-rose-500/20 text-rose-300/80 hover:border-rose-500/40"
                        : "bg-surface-raised/40 border-border text-foreground hover:border-border-highlight hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? "w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-condensed"
                          : ""
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-condensed font-bold px-1.5 py-0.2 rounded-full bg-accent/20 text-accent-text">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  {isBlocked ? (
                    <span className="text-[9px] font-condensed uppercase tracking-wider text-rose-400 truncate">
                      Cerrado
                    </span>
                  ) : dayBookings.length > 0 ? (
                    <div className="flex gap-1 overflow-hidden">
                      {dayBookings.slice(0, 3).map((b, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === "confirmado"
                              ? "bg-emerald-400"
                              : b.status === "realizado"
                                ? "bg-sky-400"
                                : "bg-accent"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day Timeline & Details (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Header of selected day */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h4 className="text-base font-black font-condensed uppercase text-foreground">
                  {selectedDateStr}
                </h4>
                <p className="text-xs text-muted font-sans">
                  {isSelectedDateBlocked ? (
                    <span className="text-rose-400">
                      ⛔ {blockedReason || "Día Bloqueado / Feriado"}
                    </span>
                  ) : (
                    `${selectedDayBookings.length} turno(s) agendado(s)`
                  )}
                </p>
              </div>

              {!isSelectedDateBlocked && (
                <button
                  onClick={() => onOpenManualBookingForDate(selectedDateStr)}
                  className="btn-shiny px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-condensed font-bold uppercase tracking-wider shadow"
                >
                  + Turno
                </button>
              )}
            </div>

            {/* Slots timeline */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {configuredSlots.length === 0 && !isSelectedDateBlocked && (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-muted italic font-sans">
                    Este día no tiene horarios en la grilla semanal estándar.
                  </p>
                  <button
                    onClick={() => onOpenManualBookingForDate(selectedDateStr)}
                    className="px-3 py-1 rounded-lg bg-surface-raised border border-border text-xs font-condensed font-bold uppercase text-accent-text hover:border-accent"
                  >
                    + Agendar turno manual aquí
                  </button>
                </div>
              )}

              {/* Show configured slots and any existing bookings on non-configured slots */}
              {Array.from(
                new Set([
                  ...configuredSlots,
                  ...selectedDayBookings.map((b) => b.time),
                ]),
              )
                .sort()
                .map((slot) => {
                  const bookingInSlot = selectedDayBookings.find(
                    (b) => b.time === slot,
                  );

                  return (
                    <div
                      key={slot}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        bookingInSlot
                          ? "bg-surface-raised border-accent/40 shadow-sm space-y-2"
                          : "bg-surface-raised/40 border-border text-muted hover:bg-surface-raised"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-condensed font-bold text-accent-text text-sm">
                          {slot} hs
                        </span>
                        {bookingInSlot ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-condensed font-bold ${
                              bookingInSlot.status === "confirmado"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : bookingInSlot.status === "realizado"
                                  ? "bg-sky-500/20 text-sky-300"
                                  : bookingInSlot.status === "cancelado"
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {bookingInSlot.status}
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              onOpenManualBookingForDate(selectedDateStr, slot)
                            }
                            className="text-[10px] text-muted hover:text-accent-text font-condensed font-bold uppercase tracking-wider underline flex items-center gap-1"
                          >
                            + Agendar en este horario
                          </button>
                        )}
                      </div>

                      {bookingInSlot && (
                        <div className="space-y-1.5 pt-1">
                          <div>
                            <p className="font-condensed font-bold uppercase text-foreground text-sm">
                              {bookingInSlot.customerName}
                            </p>
                            <p className="text-muted text-xs font-sans">
                              {bookingInSlot.planTitle} ·{" "}
                              <span className="font-mono text-accent-text font-semibold">
                                {bookingInSlot.planPrice}
                              </span>
                            </p>
                            {bookingInSlot.customerPhone && (
                              <p className="text-muted/70 font-mono text-[11px]">
                                {bookingInSlot.customerPhone}
                              </p>
                            )}
                          </div>

                          {/* Direct action buttons on calendar */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
                            {onEditBooking && (
                              <button
                                onClick={() => onEditBooking(bookingInSlot)}
                                className="px-2 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-condensed font-bold uppercase text-[10px] transition-colors"
                              >
                                Editar
                              </button>
                            )}
                            <button
                              onClick={() => onSelectBooking(bookingInSlot.id)}
                              className="px-2 py-1 rounded bg-surface border border-border hover:border-accent text-foreground font-condensed font-bold uppercase text-[10px] transition-colors"
                            >
                              Recibo
                            </button>
                            {bookingInSlot.customerPhone && (
                              <button
                                type="button"
                                onClick={() =>
                                  setWaDraft({
                                    phone: bookingInSlot.customerPhone,
                                    title: "Recordatorio de Sesión",
                                    text: buildQuickWhatsAppText(
                                      "recordatorio",
                                      bookingInSlot,
                                      bankConfig,
                                      messageTemplates,
                                    ),
                                  })
                                }
                                className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-condensed font-bold uppercase text-[10px] transition-colors"
                                title="Enviar recordatorio por WhatsApp"
                              >
                                WA
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <WhatsAppSendModal draft={waDraft} onClose={() => setWaDraft(null)} />
    </div>
  );
}
