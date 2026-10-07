"use client";

import React, { useEffect, useState } from "react";
import { ScheduleConfig, getAvailableSlots } from "@/lib/availability";
import {
  Booking,
  PaymentMethod,
  PaymentStatus,
  SessionDate,
} from "@/lib/bookings";
import { BoltIcon, CalendarIcon, EditIcon } from "./Icons";

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScheduleConfig;
  planPrices: Record<string, string | undefined>;
  onSaveBooking: (
    newBooking: Partial<Booking>,
    isEditing?: boolean,
  ) => Promise<void> | void;
  bookingToEdit?: Booking | null;
  initialDate?: string;
  initialSlot?: string;
  initialStudent?: { name: string; phone: string };
}

// Ajusta la lista de sesiones extra (2..N) al tamaño del pack.
function resizeSessionDates(list: SessionDate[], total: number): SessionDate[] {
  const count = Math.max(0, total - 1);
  return Array.from(
    { length: count },
    (_, i) => list[i] || { date: "", time: "" },
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const COMMON_TAGS = [
  "Primera Vez",
  "Hernia Lumbar",
  "Cervicalgia",
  "Escoliosis",
  "Deportista",
  "VIP",
  "Fascial",
  "Recomendado",
  "Reactivado",
];

export function ManualBookingModal({
  isOpen,
  onClose,
  config,
  planPrices,
  onSaveBooking,
  bookingToEdit,
  initialDate,
  initialSlot,
  initialStudent,
}: ManualBookingModalProps) {
  const isEditing = !!bookingToEdit;

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [planTitle, setPlanTitle] = useState("1 Sesión Individual");
  const [customPrice, setCustomPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("16:00");
  const [customTime, setCustomTime] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [status, setStatus] = useState<Booking["status"]>("confirmado");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("pendiente");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("transferencia");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(1);
  const [sessionDates, setSessionDates] = useState<SessionDate[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    if (bookingToEdit) {
      setCustomerName(bookingToEdit.customerName || "");
      setCustomerPhone(bookingToEdit.customerPhone || "");
      setPlanTitle(bookingToEdit.planTitle || "1 Sesión Individual");
      setCustomPrice(bookingToEdit.planPrice || "");
      setDate(bookingToEdit.date || new Date().toISOString().split("T")[0]);
      setTime(bookingToEdit.time || "16:00");
      setCustomTime(bookingToEdit.time || "");
      setStatus(bookingToEdit.status || "confirmado");
      setPaymentStatus(bookingToEdit.paymentStatus || "pendiente");
      setPaymentMethod(bookingToEdit.paymentMethod || "transferencia");
      setAmountPaid(
        bookingToEdit.amountPaid !== undefined
          ? String(bookingToEdit.amountPaid)
          : "",
      );
      setSessionsCompleted(bookingToEdit.sessionsCompleted || 0);
      setTotalSessions(bookingToEdit.totalSessions || 1);
      setSessionDates(
        resizeSessionDates(
          bookingToEdit.sessionDates || [],
          bookingToEdit.totalSessions || 1,
        ),
      );
      setSelectedTags(bookingToEdit.tags || []);
      setCustomerNotes(bookingToEdit.customerNotes || "");
      setInternalNotes(bookingToEdit.internalNotes || "");
    } else {
      setCustomerName(initialStudent?.name || "");
      setCustomerPhone(initialStudent?.phone || "");
      setPlanTitle("1 Sesión Individual");
      setCustomPrice("");
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setTime(initialSlot || "16:00");
      setCustomTime("");
      setUseCustomTime(false);
      setStatus("confirmado");
      setPaymentStatus("pendiente");
      setPaymentMethod("transferencia");
      setAmountPaid("");
      setSessionsCompleted(0);
      setTotalSessions(1);
      setSessionDates([]);
      setSelectedTags([]);
      setCustomerNotes("");
      setInternalNotes("");
    }
  }, [isOpen, bookingToEdit, initialDate, initialSlot, initialStudent]);

  if (!isOpen) return null;

  // Compute price based on plan
  const getPriceForPlan = (plan: string) => {
    if (customPrice && isEditing) return customPrice;
    if (plan.includes("12")) return planPrices.pack12 || "$300.000";
    if (plan.includes("8")) return planPrices.pack8 || "$240.000";
    return planPrices.individual || "$35.000";
  };

  const currentPriceStr = getPriceForPlan(planTitle);
  const currentPriceNum =
    parseInt(currentPriceStr.replace(/\D/g, ""), 10) || 35000;
  const paidNum = amountPaid
    ? parseInt(amountPaid.replace(/\D/g, ""), 10) || 0
    : 0;
  const pendingBalance = Math.max(0, currentPriceNum - paidNum);

  // Compute slots for selected date
  const selectedDateObj = new Date(`${date}T12:00:00`);
  const availableSlots = getAvailableSlots(selectedDateObj, config);
  const defaultSlotList = [
    "09:00",
    "10:30",
    "12:00",
    "15:00",
    "16:00",
    "16:30",
    "17:30",
    "18:00",
    "19:00",
    "19:30",
    "20:30",
  ];
  const slotOptions = Array.from(
    new Set([...availableSlots, ...defaultSlotList, time]),
  ).sort();

  const handlePlanSelect = (selectedPlan: string, total: number) => {
    setPlanTitle(selectedPlan);
    setTotalSessions(total);
    setSessionDates((prev) => resizeSessionDates(prev, total));
    if (!isEditing) {
      setCustomPrice(getPriceForPlan(selectedPlan));
    }
  };

  const updateSessionDate = (index: number, patch: Partial<SessionDate>) => {
    setSessionDates((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  // Completa las sesiones sin fecha una semana después de la anterior,
  // mismo horario. Las que ya tienen fecha no se tocan.
  const fillWeekly = () => {
    const baseTime =
      useCustomTime && customTime.trim() ? customTime.trim() : time;
    setSessionDates((prev) => {
      let lastDate = date;
      let lastTime = baseTime;
      return prev.map((s) => {
        const next = s.date
          ? s
          : { date: addDays(lastDate, 7), time: s.time || lastTime };
        lastDate = next.date;
        lastTime = next.time || lastTime;
        return next;
      });
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !date) return;

    const finalTime =
      useCustomTime && customTime.trim() ? customTime.trim() : time;
    if (!finalTime) return;

    setIsSubmitting(true);

    const calculatedTotalSessions =
      totalSessions > 0
        ? totalSessions
        : planTitle.includes("8")
          ? 8
          : planTitle.includes("12")
            ? 12
            : 1;

    let finalPaymentStatus = paymentStatus;
    if (paymentStatus === "pendiente" && paidNum > 0) {
      if (paidNum >= currentPriceNum) {
        finalPaymentStatus =
          paymentMethod === "efectivo"
            ? "pagado_efectivo"
            : paymentMethod === "transferencia"
              ? "pagado_transferencia"
              : "pagado_mp";
      } else {
        finalPaymentStatus = "seña";
      }
    }

    const payload: Partial<Booking> = {
      ...(bookingToEdit ? { id: bookingToEdit.id } : {}),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      planTitle,
      planPrice: currentPriceStr,
      totalAmount: currentPriceNum,
      amountPaid: paidNum > 0 ? paidNum : undefined,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      status,
      date,
      time: finalTime,
      customerNotes: customerNotes.trim(),
      internalNotes: internalNotes.trim(),
      tags: selectedTags,
      totalSessions: calculatedTotalSessions,
      sessionsCompleted: Math.min(sessionsCompleted, calculatedTotalSessions),
      sessionDates: resizeSessionDates(sessionDates, calculatedTotalSessions),
    };

    await onSaveBooking(payload, isEditing);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl text-foreground animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg ${
                isEditing
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "bg-accent/20 text-accent-text border border-accent/40"
              }`}
            >
              {isEditing ? (
                <EditIcon className="w-5 h-5" />
              ) : (
                <BoltIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-condensed uppercase tracking-tight text-foreground">
                  {isEditing
                    ? "Editar / Reprogramar Turno"
                    : "Agendar Nuevo Turno Manual"}
                </h2>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    ID: {bookingToEdit?.id.substring(0, 8)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-sans mt-0.5">
                {isEditing
                  ? "Modificá la fecha, hora, estado, pagos o datos del alumno"
                  : "Cargá reservas directas de WhatsApp, presenciales o telefónicas"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Row 1: Nombre & Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-condensed uppercase tracking-wider text-muted mb-1 font-bold">
                Nombre del Alumno *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Lucas Fernández"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-foreground placeholder-muted/40 focus:border-accent focus:outline-none transition-all font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase tracking-wider text-muted mb-1 font-bold">
                WhatsApp / Teléfono
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ej. +54 9 299 456-7890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-foreground placeholder-muted/40 focus:border-accent focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Row 2: Fecha & Horario */}
          <div className="p-4 rounded-2xl bg-surface-raised/70 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-condensed font-bold uppercase tracking-wider text-accent-text flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" /> Fecha & Horario de la
                Sesión
              </span>
              <button
                type="button"
                onClick={() => setUseCustomTime(!useCustomTime)}
                className="text-[11px] font-condensed uppercase tracking-wider text-muted hover:text-accent-text underline"
              >
                {useCustomTime
                  ? "Ver horarios disponibles"
                  : "Escribir horario personalizado"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-muted mb-1">
                  Fecha del Turno *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-muted mb-1">
                  Horario *
                </label>
                {useCustomTime ? (
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="Ej. 17:15"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground focus:border-accent focus:outline-none font-mono"
                  />
                ) : (
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground focus:border-accent focus:outline-none font-mono"
                  >
                    {slotOptions.map((s) => (
                      <option key={s} value={s}>
                        {s} hs
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Plan & Sesiones */}
          <div className="space-y-2">
            <label className="block text-xs font-condensed uppercase tracking-wider text-muted font-bold">
              Plan / Modalidad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "1 Sesión Individual",
                  label: "Individual",
                  price: planPrices.individual || "$35.000",
                  total: 1,
                },
                {
                  id: "Pack 8 Sesiones",
                  label: "Pack 8",
                  price: planPrices.pack8 || "$240.000",
                  total: 8,
                },
                {
                  id: "Pack 12 Sesiones",
                  label: "Pack 12",
                  price: planPrices.pack12 || "$300.000",
                  total: 12,
                },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePlanSelect(p.id, p.total)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    planTitle === p.id
                      ? "bg-accent/15 border-accent text-accent-text shadow-md shadow-accent/15"
                      : "bg-surface-raised border-border text-muted hover:text-foreground hover:border-border-highlight"
                  }`}
                >
                  <p className="text-xs font-condensed font-bold uppercase">
                    {p.label}
                  </p>
                  <p className="text-xs font-mono text-accent-text font-bold mt-0.5">
                    {p.price}
                  </p>
                </button>
              ))}
            </div>

            {/* Pack Progress if pack */}
            {totalSessions > 1 && (
              <div className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-4 mt-2">
                <div className="text-xs font-condensed uppercase tracking-wide">
                  <span className="text-muted">
                    Progreso de Sesiones del Pack:
                  </span>
                  <span className="font-bold text-accent-text ml-2">
                    {sessionsCompleted} de {totalSessions} realizadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSessionsCompleted(Math.max(0, sessionsCompleted - 1))
                    }
                    className="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-foreground text-sm font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono text-sm font-bold w-5 text-center">
                    {sessionsCompleted}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSessionsCompleted(
                        Math.min(totalSessions, sessionsCompleted + 1),
                      )
                    }
                    className="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-foreground text-sm font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Fechas de cada sesión del pack */}
            {totalSessions > 1 && sessionDates.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-2 mt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-condensed font-bold uppercase tracking-wide text-accent-text">
                    Fechas de las sesiones
                  </span>
                  <button
                    type="button"
                    onClick={fillWeekly}
                    className="text-[11px] font-condensed uppercase tracking-wider text-muted hover:text-accent-text underline"
                  >
                    Completar vacías (cada semana)
                  </button>
                </div>
                <p className="text-[11px] text-muted font-sans">
                  La sesión 1 es la fecha del turno de arriba. Si el alumno no
                  puede un día, cambiale la fecha acá: no hace falta crear otro
                  turno.
                </p>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {sessionDates.map((s, i) => {
                    const sessionNumber = i + 2;
                    const isDone = sessionNumber <= sessionsCompleted;
                    return (
                      <div
                        key={sessionNumber}
                        className="grid grid-cols-[4.5rem_1fr_6.5rem] items-center gap-2"
                      >
                        <span
                          className={`text-[11px] font-condensed font-bold uppercase ${
                            isDone ? "text-emerald-400" : "text-muted"
                          }`}
                        >
                          {isDone ? "✓ " : ""}Sesión {sessionNumber}
                        </span>
                        <input
                          type="date"
                          aria-label={`Fecha de la sesión ${sessionNumber}`}
                          value={s.date}
                          onChange={(e) =>
                            updateSessionDate(i, { date: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground focus:border-accent focus:outline-none font-mono"
                        />
                        <input
                          type="time"
                          aria-label={`Horario de la sesión ${sessionNumber}`}
                          value={s.time}
                          onChange={(e) =>
                            updateSessionDate(i, { time: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground focus:border-accent focus:outline-none font-mono"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Estado del Turno & Control Financiero */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-condensed font-bold uppercase tracking-wider text-accent-text">
                Estado & Control Financiero
              </span>
              <span className="text-muted text-xs font-mono">
                Total: {currentPriceStr}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Estado del Turno */}
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-muted mb-1">
                  Estado de la Reserva
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Booking["status"])
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-condensed uppercase font-bold text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="confirmado">Confirmado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Monto Abonado */}
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-muted mb-1">
                  Monto Abonado ($)
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Ej. 10000"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-mono text-emerald-400 font-bold placeholder-muted/40 focus:border-accent focus:outline-none"
                />
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-[11px] font-condensed uppercase tracking-wider text-muted mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs font-condensed uppercase text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo en Estudio</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </div>
            </div>

            {/* Quick Balance Status */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border font-mono">
              <span className="text-emerald-400">
                Abonado: ${paidNum.toLocaleString("es-AR")}
              </span>
              <span
                className={
                  pendingBalance > 0
                    ? "text-accent-text font-bold"
                    : "text-emerald-400 font-bold"
                }
              >
                {pendingBalance > 0
                  ? `Saldo Restante: $${pendingBalance.toLocaleString("es-AR")}`
                  : "¡Totalmente Pagado!"}
              </span>
            </div>
          </div>

          {/* Tags Clínicos */}
          <div>
            <label className="block text-xs font-condensed uppercase tracking-wider text-muted mb-1.5 font-bold">
              Etiquetas Clínicas / Patologías
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-condensed font-bold uppercase tracking-wider border transition-all ${
                      isSelected
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-surface-raised text-muted border-border hover:text-foreground"
                    }`}
                  >
                    {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comentarios y Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-condensed uppercase tracking-wider text-muted mb-1 font-bold">
                Consulta / Comentarios del Alumno
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Dolores referidos, motivo de consulta..."
                className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-foreground placeholder-muted/40 focus:border-accent focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-condensed uppercase tracking-wider text-muted mb-1 font-bold">
                Nota Interna del Instructor
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ajustes de tensión, precauciones de tracción..."
                className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border text-xs text-foreground placeholder-muted/40 focus:border-accent focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-condensed font-bold uppercase text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-shiny px-6 py-3 rounded-xl bg-accent text-accent-foreground font-condensed font-bold uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-accent/25 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Guardar Cambios del Turno"
                  : "Confirmar y Agendar Turno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
