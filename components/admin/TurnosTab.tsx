"use client";

import React, { useState } from "react";
import {
  BankConfig,
  Booking,
  PaymentStatus,
  MessageTemplatesConfig,
  buildGoogleCalendarUrl,
  buildQuickWhatsAppText,
  buildGoogleReviewWhatsAppText,
} from "@/lib/bookings";
import { CalendarIcon, ReceiptIcon, TrashIcon } from "./Icons";
import { WhatsAppDraft, WhatsAppSendModal } from "./WhatsAppSendModal";

interface TurnosTabProps {
  bookings: Booking[];
  bankConfig: BankConfig;
  messageTemplates?: MessageTemplatesConfig;
  onUpdateStatus: (id: string, status: Booking["status"]) => void;
  onUpdatePaymentStatus: (id: string, paymentStatus: PaymentStatus) => void;
  onSaveInternalNote: (id: string, note: string) => void;
  onIncrementSession: (id: string, current: number, total: number) => void;
  onDeleteBooking: (id: string) => void;
  onOpenReceiptModal: (booking: Booking) => void;
  onOpenStudentCrm: (phone: string, name: string) => void;
  onEditBooking: (booking: Booking) => void;
  onReloadSamples?: () => void;
}

export function TurnosTab({
  bookings,
  bankConfig,
  messageTemplates,
  onUpdateStatus,
  onUpdatePaymentStatus,
  onSaveInternalNote,
  onIncrementSession,
  onDeleteBooking,
  onOpenReceiptModal,
  onOpenStudentCrm,
  onEditBooking,
  onReloadSamples,
}: TurnosTabProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateMode, setFilterDateMode] = useState<
    "todos" | "hoy" | "manana" | "semana" | "pendientes"
  >("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterPayment, setFilterPayment] = useState<string>("todos");

  // State for active note edit
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // WhatsApp dropdown per item
  const [activeWaMenuId, setActiveWaMenuId] = useState<string | null>(null);
  const [waDraft, setWaDraft] = useState<WhatsAppDraft | null>(null);

  const handleStatusSelect = (
    booking: Booking,
    newStatus: Booking["status"],
  ) => {
    onUpdateStatus(booking.id, newStatus);

    // AUTOMATION: Solicitud de Reseña en Google al marcar "realizado" (sesión completada)
    if (
      newStatus === "realizado" &&
      messageTemplates?.autoPromptReviewOnComplete !== false &&
      booking.customerPhone
    ) {
      setWaDraft({
        phone: booking.customerPhone,
        title: "⭐ Pedir Reseña en Google (Automatización)",
        text: buildGoogleReviewWhatsAppText(
          booking.customerName,
          messageTemplates,
        ),
      });
    }

    // AUTOMATION: Confirmación de Turno al marcar "confirmado"
    if (
      newStatus === "confirmado" &&
      messageTemplates?.autoPromptConfirmOnConfirm !== false &&
      booking.customerPhone
    ) {
      setWaDraft({
        phone: booking.customerPhone,
        title: "📩 Confirmar Turno (Automatización)",
        text: buildQuickWhatsAppText(
          "confirmar",
          { ...booking, status: newStatus },
          bankConfig,
          messageTemplates,
        ),
      });
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  // Filtering
  const filteredBookings = bookings.filter((b) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        b.customerName.toLowerCase().includes(q) ||
        (b.customerPhone || "").includes(q) ||
        b.planTitle.toLowerCase().includes(q) ||
        b.date.includes(q) ||
        (b.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status Filter
    if (filterStatus !== "todos" && b.status !== filterStatus) return false;

    // Payment Filter
    if (filterPayment !== "todos") {
      if (
        filterPayment === "pendiente" &&
        b.paymentStatus !== "pendiente" &&
        b.paymentStatus !== undefined
      )
        return false;
      if (filterPayment === "seña" && b.paymentStatus !== "seña") return false;
      if (filterPayment === "pagado" && !b.paymentStatus?.startsWith("pagado"))
        return false;
    }

    // Date Mode Filter
    if (filterDateMode === "hoy" && b.date !== todayStr) return false;
    if (filterDateMode === "manana" && b.date !== tomorrowStr) return false;
    if (
      filterDateMode === "semana" &&
      (b.date < todayStr || b.date > in7DaysStr)
    )
      return false;
    if (filterDateMode === "pendientes" && b.status !== "pendiente")
      return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="admin-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por alumno, teléfono, plan o tag (Atajo: presiona '/')"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border text-xs sm:text-sm text-foreground placeholder-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border self-end sm:self-auto">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === "cards"
                  ? "bg-accent/20 text-accent-text border border-accent/40 shadow"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-accent/20 text-accent-text border border-accent/40 shadow"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Tabla
            </button>
          </div>
        </div>

        {/* Filter Badges & Selects */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "todos", label: "Todos" },
              { id: "hoy", label: "Hoy" },
              { id: "manana", label: "Mañana" },
              { id: "semana", label: "Próx. 7 Días" },
              { id: "pendientes", label: "Solo Pendientes" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterDateMode(f.id as typeof filterDateMode)}
                className={`px-3 py-1 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all ${
                  filterDateMode === f.id
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                    : "bg-surface-raised text-muted hover:text-foreground border border-border"
                }`}
              >
                {f.label}
              </button>
            ))}

            {onReloadSamples && (
              <button
                onClick={onReloadSamples}
                className="px-3 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-accent text-xs font-condensed font-bold uppercase tracking-wider text-accent-text transition-all flex items-center gap-1.5"
                title="Cargar o actualizar turnos realistas de muestra"
              >
                <svg
                  className="w-3.5 h-3.5 text-accent-text"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Cargar Turnos</span>
              </button>
            )}
          </div>

          {/* Status & Payment Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-xs font-condensed uppercase tracking-wide text-foreground focus:border-accent focus:outline-none"
            >
              <option value="todos">Estado: Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="realizado">Realizados</option>
              <option value="cancelado">Cancelados</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-xs font-condensed uppercase tracking-wide text-foreground focus:border-accent focus:outline-none"
            >
              <option value="todos">Pago: Todos</option>
              <option value="pendiente">Pago Pendiente</option>
              <option value="seña">Con Seña</option>
              <option value="pagado">Pagado Total</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-condensed uppercase tracking-wider text-muted px-1">
        <span>
          Mostrando {filteredBookings.length} de {bookings.length} turnos
        </span>
        {searchQuery && <span>Filtro activo: &ldquo;{searchQuery}&rdquo;</span>}
      </div>

      {/* Bookings View: Cards or Table */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl bg-surface border border-dashed border-border space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-raised mx-auto flex items-center justify-center text-muted">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-base font-condensed font-bold uppercase tracking-wider text-foreground">
              No se encontraron turnos con los filtros actuales.
            </p>
            <p className="text-xs text-muted font-sans mt-1">
              Podés cargar turnos de prueba realistas o crear un turno nuevo
              manualmente.
            </p>
          </div>
          {onReloadSamples && (
            <div className="pt-2">
              <button
                onClick={onReloadSamples}
                className="btn-shiny px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-condensed font-bold uppercase tracking-wider text-xs shadow-lg shadow-accent/25 hover:opacity-95 transition-all inline-flex items-center gap-2"
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Cargar Turnos de Prueba / Nuevos Turnos</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const isToday = b.date === todayStr;
            const isTomorrow = b.date === tomorrowStr;
            const totalSess = b.totalSessions || 1;
            const completedSess = b.sessionsCompleted || 0;

            return (
              <div
                key={b.id}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isToday
                    ? "bg-surface-raised border-accent/60 shadow-lg shadow-accent/10"
                    : "bg-surface border-border hover:border-border-highlight"
                }`}
              >
                <div>
                  {/* Top Bar: Date, Slot & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30 text-accent-text text-xs font-condensed font-bold">
                        {b.time} hs
                      </span>
                      <span className="text-xs font-condensed font-semibold text-foreground/90">
                        {b.date}
                        {isToday && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-accent text-accent-foreground font-bold text-[10px]">
                            HOY
                          </span>
                        )}
                        {isTomorrow && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px]">
                            MAÑANA
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => onEditBooking(b)}
                        className="px-2 py-1.5 rounded-lg bg-surface-raised hover:bg-surface border border-border hover:border-sky-500/50 text-sky-400 hover:text-sky-300 text-[11px] font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                        title="Editar o Reprogramar Turno"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span>Editar</span>
                      </button>

                      {/* Status dropdown */}
                      <select
                        value={b.status}
                        onChange={(e) =>
                          handleStatusSelect(
                            b,
                            e.target.value as Booking["status"],
                          )
                        }
                        className={`text-[11px] font-condensed font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                          b.status === "confirmado"
                            ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
                            : b.status === "realizado"
                              ? "bg-sky-950/90 text-sky-300 border-sky-500/60"
                              : b.status === "cancelado"
                                ? "bg-rose-950/90 text-rose-300 border-rose-500/60"
                                : "bg-amber-950/90 text-amber-300 border-amber-500/60"
                        }`}
                      >
                        <option
                          value="pendiente"
                          className="bg-[#18191c] text-amber-300 font-bold py-1.5"
                        >
                          ● Pendiente
                        </option>
                        <option
                          value="confirmado"
                          className="bg-[#18191c] text-emerald-400 font-bold py-1.5"
                        >
                          ● Confirmado
                        </option>
                        <option
                          value="realizado"
                          className="bg-[#18191c] text-sky-400 font-bold py-1.5"
                        >
                          ● Realizado
                        </option>
                        <option
                          value="cancelado"
                          className="bg-[#18191c] text-rose-400 font-bold py-1.5"
                        >
                          ● Cancelado
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <h4
                        onClick={() =>
                          b.customerPhone &&
                          onOpenStudentCrm(b.customerPhone, b.customerName)
                        }
                        className="text-base font-condensed font-bold uppercase tracking-wide text-foreground hover:text-accent-text cursor-pointer transition-colors"
                        title="Ver historial / ficha clínica"
                      >
                        {b.customerName}
                      </h4>
                      {b.customerPhone && (
                        <button
                          onClick={() =>
                            onOpenStudentCrm(b.customerPhone!, b.customerName)
                          }
                          className="text-[10px] font-condensed font-bold uppercase tracking-wider text-muted hover:text-accent-text underline"
                        >
                          Ficha CRM →
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted font-mono">
                      {b.customerPhone || "Sin teléfono registrado"}
                    </p>
                  </div>

                  {/* Plan & Payment Badge */}
                  <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-2 mb-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-foreground font-condensed font-bold uppercase tracking-wide">
                        {b.planTitle}
                      </span>
                      <span className="font-mono text-accent-text font-bold">
                        {b.planPrice}
                      </span>
                    </div>

                    {/* Pack progress if pack */}
                    {totalSess > 1 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] text-muted">
                          <span className="font-condensed uppercase tracking-wider">
                            Progreso de Pack:
                          </span>
                          <span className="font-mono text-foreground font-semibold">
                            {completedSess}/{totalSess} sesiones
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden flex">
                          <div
                            className="bg-accent h-full transition-all"
                            style={{
                              width: `${(completedSess / totalSess) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Payment Status Pill */}
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <button
                        onClick={() => onOpenReceiptModal(b)}
                        className="text-xs flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        title="Ver comprobante y detalle de saldo"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            b.paymentStatus?.startsWith("pagado")
                              ? "bg-emerald-400"
                              : b.paymentStatus === "seña"
                                ? "bg-accent"
                                : "bg-rose-400 animate-pulse"
                          }`}
                        />
                        <span className="text-foreground/90 font-condensed font-bold uppercase tracking-wide">
                          {b.paymentStatus === "seña"
                            ? `Seña ($${b.amountPaid?.toLocaleString("es-AR") || "Parcial"})`
                            : b.paymentStatus?.startsWith("pagado")
                              ? "Pagado 100%"
                              : "Pago Pendiente"}
                        </span>
                        <span className="text-[10px] text-accent-text font-condensed font-bold uppercase underline">
                          Recibo{" "}
                          <ReceiptIcon className="w-3 h-3 inline -mt-0.5" />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  {b.tags && b.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {b.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-condensed uppercase font-semibold bg-surface text-muted border border-border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Customer Notes */}
                  {b.customerNotes && (
                    <p className="text-xs text-muted italic mb-3 bg-surface p-2 rounded-lg border border-border">
                      &ldquo;{b.customerNotes}&rdquo;
                    </p>
                  )}

                  {/* Internal Instructor Note */}
                  <div className="mb-3">
                    {editingNoteId === b.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="Nota privada del instructor..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-accent text-xs text-foreground focus:outline-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 rounded text-[10px] font-condensed uppercase text-muted hover:text-foreground"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              onSaveInternalNote(b.id, tempNoteText);
                              setEditingNoteId(null);
                            }}
                            className="btn-shiny px-2.5 py-1 rounded bg-accent text-accent-foreground font-condensed font-bold uppercase text-[10px]"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNoteId(b.id);
                          setTempNoteText(b.internalNotes || "");
                        }}
                        className="text-xs text-muted hover:text-foreground cursor-pointer p-1.5 rounded bg-surface border border-dashed border-border flex items-center justify-between"
                        title="Click para editar nota interna"
                      >
                        <span className="truncate font-sans text-xs">
                          {b.internalNotes
                            ? `📝 ${b.internalNotes}`
                            : "+ Agregar nota interna del instructor..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                  {/* WhatsApp dropdown button */}
                  {b.customerPhone ? (
                    <div className="relative flex-1">
                      <button
                        onClick={() =>
                          setActiveWaMenuId(
                            activeWaMenuId === b.id ? null : b.id,
                          )
                        }
                        className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] border border-[#25D366]/40 text-white font-bold text-xs font-condensed uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#25D366]/20 transition-all"
                      >
                        <svg
                          className="w-3.5 h-3.5 fill-white shrink-0"
                          viewBox="0 0 24 24"
                        >
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                        <span className="text-white font-bold">WhatsApp</span>
                        <svg
                          className="w-3 h-3 text-white ml-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Options */}
                      {activeWaMenuId === b.id && (
                        <div className="absolute left-0 bottom-full mb-1 w-56 bg-[#18191c] border border-white/[0.1] rounded-xl shadow-2xl p-1.5 z-20 space-y-0.5">
                          {[
                            { type: "confirmar", label: "Confirmar Turno" },
                            {
                              type: "recordatorio",
                              label: "Recordatorio de Sesión",
                            },
                            { type: "resena", label: "⭐ Pedir Reseña Google" },
                            { type: "reagendar", label: "🔄 Reagendar Turno" },
                            { type: "pago", label: "Enviar Datos de Pago" },
                            { type: "ubicacion", label: "Cómo llegar / Mapa" },
                            {
                              type: "seguimiento_post",
                              label: "Seguimiento Post-Sesión",
                            },
                            {
                              type: "renovacion",
                              label: "Ofrecer Renovación Pack",
                            },
                          ].map((item) => (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => {
                                setActiveWaMenuId(null);
                                setWaDraft({
                                  phone: b.customerPhone,
                                  title: item.label,
                                  text: buildQuickWhatsAppText(
                                    item.type as any,
                                    b,
                                    bankConfig,
                                    messageTemplates,
                                  ),
                                });
                              }}
                              className="block w-full text-left px-3 py-1.5 rounded-lg text-xs text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Pack increment button */}
                  {totalSess > 1 && (
                    <button
                      onClick={() =>
                        onIncrementSession(b.id, completedSess, totalSess)
                      }
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs"
                      title="Registrar +1 sesión realizada en el pack"
                    >
                      +1 Sesión
                    </button>
                  )}

                  {/* Google Calendar */}
                  <a
                    href={buildGoogleCalendarUrl(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-surface-raised hover:bg-surface border border-border text-foreground/70 hover:text-foreground transition-colors"
                    title="Añadir a Google Calendar"
                    aria-label="Añadir a Google Calendar"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteBooking(b.id)}
                    className="p-2 rounded-lg bg-surface-raised hover:bg-rose-500/20 border border-border hover:border-rose-500/40 text-muted hover:text-rose-400 transition-colors"
                    title="Eliminar registro"
                    aria-label="Eliminar turno"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.01]">
          <table className="w-full text-left text-xs text-white/80">
            <thead className="bg-white/[0.03] text-[11px] font-mono text-white/50 uppercase tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredBookings.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-mono">
                    <span className="text-amber-400 font-bold">
                      {b.time} hs
                    </span>
                    <span className="text-white/50 block text-[11px]">
                      {b.date}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      onClick={() =>
                        b.customerPhone &&
                        onOpenStudentCrm(b.customerPhone, b.customerName)
                      }
                      className="font-semibold text-white hover:text-amber-300 cursor-pointer block"
                    >
                      {b.customerName}
                    </span>
                    <span className="text-white/40 text-[11px] font-mono">
                      {b.customerPhone}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span>{b.planTitle}</span>
                    <span className="text-amber-400 font-mono block text-[11px]">
                      {b.planPrice}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) =>
                        handleStatusSelect(
                          b,
                          e.target.value as Booking["status"],
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#18191c] border border-white/20 text-xs font-condensed font-bold uppercase text-white cursor-pointer focus:outline-none"
                    >
                      <option
                        value="pendiente"
                        className="bg-[#18191c] text-amber-300 font-bold py-1"
                      >
                        ● Pendiente
                      </option>
                      <option
                        value="confirmado"
                        className="bg-[#18191c] text-emerald-400 font-bold py-1"
                      >
                        ● Confirmado
                      </option>
                      <option
                        value="realizado"
                        className="bg-[#18191c] text-sky-400 font-bold py-1"
                      >
                        ● Realizado
                      </option>
                      <option
                        value="cancelado"
                        className="bg-[#18191c] text-rose-400 font-bold py-1"
                      >
                        ● Cancelado
                      </option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onOpenReceiptModal(b)}
                      className="text-xs font-mono text-amber-300 hover:underline"
                    >
                      {b.paymentStatus || "pendiente"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => onEditBooking(b)}
                      className="p-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[11px]"
                    >
                      Editar
                    </button>
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
                        className="px-2.5 py-1 rounded-lg bg-[#25D366] text-white font-bold hover:bg-[#20ba59] text-[11px] font-condensed uppercase tracking-wider inline-flex items-center gap-1 shadow-sm"
                      >
                        <svg
                          className="w-3 h-3 fill-white shrink-0"
                          viewBox="0 0 24 24"
                        >
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                        <span>WA</span>
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteBooking(b.id)}
                      className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px]"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <WhatsAppSendModal draft={waDraft} onClose={() => setWaDraft(null)} />
    </div>
  );
}
