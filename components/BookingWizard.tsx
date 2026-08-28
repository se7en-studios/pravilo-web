"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PLANES, type Plan } from "@/lib/plans";
import {
  DEFAULT_SCHEDULE_CONFIG,
  LOCAL_STORAGE_SCHEDULE_KEY,
  ScheduleConfig,
  buildWhatsAppBookingUrl,
  formatDateSpanish,
  getAvailableSlots,
  getAllSlotsWithStatus,
  isDateAvailable,
  isDateFullyBooked,
  type SlotOccupancy,
} from "@/lib/availability";

export default function BookingWizard({
  className = "",
  buttonText = "Reservar turno",
}: {
  className?: string;
  buttonText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANES[0]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_SCHEDULE_CONFIG);
  // Ocupación de horarios (solo fecha/hora/estado — sin datos de otros clientes)
  const [bookings, setBookings] = useState<SlotOccupancy[]>([]);
  const [mounted, setMounted] = useState(false);

  const [planPrices, setPlanPrices] = useState<{ [key: string]: string }>({});

  const loadBookings = () => {
    // Ocupación de slots desde el endpoint público (sin PII de clientes)
    fetch("/api/availability")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.occupied)) {
          setBookings(data.occupied);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setMounted(true);
    loadBookings();

    // Cargar configuración de disponibilidad
    const stored = localStorage.getItem(LOCAL_STORAGE_SCHEDULE_KEY);
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch {
        // fallback
      }
    }

    const savedPrices = localStorage.getItem("pravilo_plan_prices");
    if (savedPrices) {
      try {
        const parsed = JSON.parse(savedPrices);
        setPlanPrices(parsed);
      } catch {
        // fallback
      }
    }

    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) {
          if (data.config) {
            setConfig(data.config);
            localStorage.setItem(
              LOCAL_STORAGE_SCHEDULE_KEY,
              JSON.stringify(data.config),
            );
          }
          if (data.planPrices) {
            setPlanPrices(data.planPrices);
            localStorage.setItem("pravilo_plan_prices", JSON.stringify(data.planPrices));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Bloquear scroll de la página cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOpen = () => {
    loadBookings();
    setStep(1);
    setSelectedTime("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmAndSend = async () => {
    if (!selectedDate || !selectedTime || !customerName.trim()) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Validar que el horario no esté tomado
    const isSlotOccupied = bookings.some(
      (b) => b.date === dateStr && b.time === selectedTime && b.status !== "cancelado",
    );

    if (isSlotOccupied) {
      alert("El horario seleccionado ya se encuentra confirmado u ocupado. Por favor seleccioná otro horario disponible.");
      setStep(3);
      setSelectedTime("");
      return;
    }

    // Registrar el turno en el panel / sistema
    try {
      const bookingPayload = {
        planTitle: selectedPlan.title,
        planPrice: selectedPlan.price,
        date: dateStr,
        time: selectedTime,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerNotes: customerNotes.trim(),
        status: "pendiente",
        paymentStatus: "pendiente",
      };

      // Registrar en el servidor (el WhatsApp que sigue es el canal principal de
      // la reserva, por eso no bloqueamos al cliente si esta llamada falla).
      fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      })
        .then((res) => res.json().catch(() => null))
        .then((data) => {
          if (!data?.ok) {
            console.warn("No se pudo registrar la reserva en el panel:", data?.error);
          }
          loadBookings(); // refrescar ocupación de horarios
        })
        .catch((err) => console.warn("No se pudo registrar la reserva en el panel:", err));

      // Aviso instantáneo a otras pestañas (Panel Admin)
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("pravilo_sync_channel");
          bc.postMessage({ type: "NEW_BOOKING" });
          setTimeout(() => bc.close(), 1000);
        }
      } catch {}
    } catch {
      // ignore
    }

    const url = buildWhatsAppBookingUrl(
      {
        plan: selectedPlan,
        date: selectedDate,
        time: selectedTime,
        customerName,
        customerPhone,
        customerNotes,
      },
      config.whatsappNumber,
    );

    // Abrir WhatsApp en nueva pestaña
    window.open(url, "_blank");
    handleClose();

    // Redirigir a la página de confirmación enriquecida
    const confirmUrl = `/reserva-confirmada?plan=${encodeURIComponent(selectedPlan.title)}&price=${encodeURIComponent(selectedPlan.price)}&date=${dateStr}&time=${encodeURIComponent(selectedTime)}&name=${encodeURIComponent(customerName)}`;
    window.location.href = confirmUrl;
  };

  // Generar días del mes actual para el calendario
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    const startingOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startingOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const isDateEnabled = isDateAvailable(date, config);
      const isFull = isDateFullyBooked(date, config, bookings);
      const isAvailable = isDateEnabled && !isFull;

      const isSelected =
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === d;
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === d;

      days.push(
        <button
          key={`day-${d}`}
          type="button"
          disabled={!isAvailable}
          title={isFull ? "Sin turnos disponibles (Completo)" : !isDateEnabled ? "Día no laborable / Bloqueado" : "Disponible"}
          onClick={() => {
            setSelectedDate(date);
            setSelectedTime("");
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl font-condensed text-sm font-semibold transition-all ${
            isSelected
              ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-105"
              : isAvailable
                ? "bg-surface text-foreground hover:border-accent hover:border hover:text-accent-text"
                : isFull
                  ? "text-accent-text/40 line-through cursor-not-allowed bg-surface-raised/20"
                  : "text-muted/30 cursor-not-allowed bg-transparent"
          } ${isToday && !isSelected ? "border border-accent/40 text-accent-text" : ""}`}
        >
          {d}
        </button>,
      );
    }

    return days;
  };

  const handlePrevMonth = () => {
    const prev = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    const today = new Date();
    if (
      prev.getFullYear() < today.getFullYear() ||
      (prev.getFullYear() === today.getFullYear() &&
        prev.getMonth() < today.getMonth())
    ) {
      return;
    }
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const allSlots = selectedDate
    ? getAllSlotsWithStatus(selectedDate, config, bookings)
    : [];
  const hasAvailableSlots = allSlots.some((s) => s.isAvailable);

  return (
    <>
      <button type="button" onClick={handleOpen} className={className}>
        {buttonText}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Fondo oscuro backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={handleClose}
            />

            {/* Modal */}
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
            >
              {/* Botón cerrar */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar ventana"
                className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-lg text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                &times;
              </button>

              {/* Indicador de Pasos */}
              <div className="mb-6 flex items-center justify-between border-b border-border/70 pb-4 pr-8">
                <div>
                  <span className="font-condensed text-xs font-bold uppercase tracking-wider text-accent-text">
                    Paso {step} de 4
                  </span>
                  <h2 className="font-condensed text-2xl font-extrabold text-foreground">
                    {step === 1 && "Elegí tu Plan"}
                    {step === 2 && "Seleccioná la Fecha"}
                    {step === 3 && "Elegí el Horario"}
                    {step === 4 && "Confirmá tu Reserva"}
                  </h2>
                </div>

                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        s === step
                          ? "w-6 bg-accent"
                          : s < step
                            ? "w-2 bg-accent/60"
                            : "w-2 bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* PASO 1: Elegir Plan */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-muted">
                    Seleccioná el formato que mejor se adapte a tu objetivo biomecánico:
                  </p>

                  <div className="space-y-3">
                    {PLANES.map((p) => {
                      const displayPrice = p.title.includes("12")
                        ? planPrices.pack12 || p.price
                        : p.title.includes("8")
                          ? planPrices.pack8 || p.price
                          : planPrices.individual || p.price;
                      const isSelected = selectedPlan.title === p.title;
                      return (
                        <button
                          key={p.title}
                          type="button"
                          onClick={() =>
                            setSelectedPlan({ ...p, price: displayPrice })
                          }
                          className={`group flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-accent bg-accent/15 shadow-[0_0_30px_-8px_rgba(160,26,26,0.6)] scale-[1.01]"
                              : "border-border bg-surface-raised/70 hover:border-border-highlight hover:bg-surface-raised"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-condensed text-lg font-bold text-foreground group-hover:text-accent-text transition-colors">
                                {p.title}
                              </span>
                              {p.highlight && (
                                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-condensed font-bold uppercase tracking-wider text-accent-foreground shadow-sm">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted leading-relaxed">{p.desc}</p>
                          </div>
                          <span className="font-condensed text-2xl font-black text-accent-text ml-3 shrink-0">
                            {displayPrice}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-7 flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-shiny rounded-full bg-accent px-7 py-3 font-condensed text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-md transition-all hover:scale-105"
                    >
                      Continuar a la fecha →
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: Calendario de Fecha */}
              {step === 2 && (
                <div>
                  <p className="text-xs text-muted mb-4">
                    Seleccioná el día para tu sesión en el centro de Plottier:
                  </p>

                  <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                    {/* Navegación mes */}
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-condensed text-lg font-bold text-foreground">
                        {monthNames[currentMonth.getMonth()]}{" "}
                        {currentMonth.getFullYear()}
                      </h3>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          aria-label="Mes anterior"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-sm text-foreground hover:border-accent"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          aria-label="Mes siguiente"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-sm text-foreground hover:border-accent"
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {/* Días de la semana */}
                    <div className="mb-2 grid grid-cols-7 text-center font-condensed text-xs font-bold text-muted">
                      <span>Lun</span>
                      <span>Mar</span>
                      <span>Mié</span>
                      <span>Jue</span>
                      <span>Vie</span>
                      <span>Sáb</span>
                      <span>Dom</span>
                    </div>

                    {/* Grid de días */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {renderCalendarDays()}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-3 text-center text-xs text-accent-text font-semibold">
                      Día seleccionado: {formatDateSpanish(selectedDate)}
                    </div>
                  )}

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted hover:text-foreground"
                    >
                      ← Volver
                    </button>
                    <button
                      type="button"
                      disabled={!selectedDate}
                      onClick={() => setStep(3)}
                      className="rounded-full bg-accent px-6 py-2.5 font-condensed text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Elegir horario →
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: Selector de Horario */}
              {step === 3 && (
                <div>
                  <p className="text-xs text-muted mb-2">
                    Horarios disponibles para el{" "}
                    <strong className="text-foreground">
                      {selectedDate && formatDateSpanish(selectedDate)}
                    </strong>
                    :
                  </p>

                  {!hasAvailableSlots ? (
                    <div className="my-6 rounded-2xl border border-border bg-background p-6 text-center text-sm text-muted">
                      No hay horarios disponibles para esta fecha (todos los turnos se encuentran ocupados o confirmados). Por favor elegí otro día en el calendario.
                    </div>
                  ) : (
                    <div className="my-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {allSlots.map(({ slot, isAvailable }) => {
                        const isSelected = selectedTime === slot;
                        if (!isAvailable) {
                          return (
                            <div
                              key={slot}
                              className="flex h-12 flex-col items-center justify-center rounded-xl border border-border/40 bg-surface-raised/30 opacity-40 cursor-not-allowed select-none"
                              title="Horario ocupado / confirmado por otro alumno"
                            >
                              <span className="font-condensed text-xs font-bold line-through text-muted">{slot} hs</span>
                              <span className="text-[9px] font-condensed uppercase tracking-wider text-accent-text font-black">Ocupado</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`flex h-12 items-center justify-center rounded-xl border font-condensed text-base font-bold transition-all ${
                              isSelected
                                ? "border-accent bg-accent text-accent-foreground shadow-md shadow-accent/30 scale-105"
                                : "border-border bg-background text-foreground hover:border-accent/60 hover:text-accent-text"
                            }`}
                          >
                            {slot} hs
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted hover:text-foreground"
                    >
                      ← Cambiar día
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTime}
                      onClick={() => setStep(4)}
                      className="rounded-full bg-accent px-6 py-2.5 font-condensed text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Completar datos →
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 4: Datos del cliente y Envío por WhatsApp */}
              {step === 4 && (
                <div className="space-y-4">
                  {/* Resumen del turno */}
                  <div className="rounded-2xl border border-border bg-background p-4 text-xs space-y-1.5 shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Plan:</span>
                      <span className="font-semibold text-foreground">
                        {selectedPlan.title} ({selectedPlan.price})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Fecha:</span>
                      <span className="font-semibold text-accent-text">
                        {selectedDate && formatDateSpanish(selectedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Horario:</span>
                      <span className="font-semibold text-accent-text">
                        {selectedTime} hs (60 min)
                      </span>
                    </div>
                  </div>

                  {/* Formulario */}
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="booking-name"
                        className="block text-xs font-semibold text-foreground mb-1"
                      >
                        Nombre y Apellido *
                      </label>
                      <input
                        id="booking-name"
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: Sofía Valenzuela"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="booking-phone"
                        className="block text-xs font-semibold text-foreground mb-1"
                      >
                        Teléfono / WhatsApp (opcional)
                      </label>
                      <input
                        id="booking-phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej: 299 1234567"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="booking-notes"
                        className="block text-xs font-semibold text-foreground mb-1"
                      >
                        ¿Tenés algún dolor o consulta previa? (opcional)
                      </label>
                      <textarea
                        id="booking-notes"
                        rows={2}
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Ej: Dolor lumbar, primera vez con el método..."
                        className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-muted hover:text-foreground"
                    >
                      ← Cambiar horario
                    </button>
                    <button
                      type="button"
                      disabled={!customerName.trim()}
                      onClick={handleConfirmAndSend}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-condensed text-base font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 fill-current"
                      >
                        <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.7 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z" />
                      </svg>
                      <span>Confirmar y Enviar por WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
