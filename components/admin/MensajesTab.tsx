"use client";

import React, { useState, useMemo } from "react";
import {
  BankConfig,
  DEFAULT_BANK_CONFIG,
  DEFAULT_MESSAGE_TEMPLATES,
  MessageTemplatesConfig,
  interpolateMessageTemplate,
  relativeDayLabel,
} from "@/lib/bookings";
import { GOOGLE_MAPS_URL, GOOGLE_WRITE_REVIEW_URL, LOCATION } from "@/lib/constants";

interface MensajesTabProps {
  messageTemplates: MessageTemplatesConfig;
  onSaveMessageTemplates: (templates: MessageTemplatesConfig) => void;
  bankConfig: BankConfig;
  saveStatus?: string | null;
}

type TemplateKey = keyof Omit<
  MessageTemplatesConfig,
  "autoPromptReviewOnComplete" | "autoPromptConfirmOnConfirm"
>;

interface TemplateMeta {
  key: TemplateKey;
  title: string;
  category: "Turnos" | "Pagos" | "Fidelización" | "Vouchers";
  icon: string;
  description: string;
  availableVars: { tag: string; label: string }[];
}

const TEMPLATES_META: TemplateMeta[] = [
  {
    key: "confirmar",
    title: "Confirmación de Turno",
    category: "Turnos",
    icon: "📩",
    description: "Enviado al alumno cuando su turno queda confirmado.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{plan}", label: "Nombre del plan" },
      { tag: "{fecha}", label: "Fecha del turno" },
      { tag: "{hora}", label: "Horario del turno" },
      { tag: "{ubicacion}", label: "Dirección del estudio" },
      { tag: "{maps_url}", label: "Link de Google Maps" },
    ],
  },
  {
    key: "recordatorio",
    title: "Recordatorio de Sesión",
    category: "Turnos",
    icon: "⏰",
    description: "Recordatorio antes del turno (dice 'hoy', 'mañana' o la fecha según corresponda).",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{plan}", label: "Nombre del plan" },
      { tag: "{dia_relativo}", label: "Día relativo (hoy / mañana / fecha)" },
      { tag: "{hora}", label: "Horario del turno" },
    ],
  },
  {
    key: "resena",
    title: "Solicitud de Reseña Google",
    category: "Fidelización",
    icon: "⭐",
    description: "Mensaje para invitar al alumno a calificar su experiencia en Google Maps tras su sesión.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{review_url}", label: "Link directo a reseña de Google" },
      { tag: "{plan}", label: "Nombre del plan" },
    ],
  },
  {
    key: "seguimiento_post",
    title: "Seguimiento Post-Sesión",
    category: "Turnos",
    icon: "🧘‍♂️",
    description: "Consulta de bienestar corporal e hidratación fascial luego de la práctica.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{plan}", label: "Nombre del plan" },
    ],
  },
  {
    key: "reagendar",
    title: "Reagendar Turno",
    category: "Turnos",
    icon: "🔄",
    description: "Mensaje para coordinar un nuevo día u horario cuando se necesita mover el turno.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{fecha}", label: "Fecha actual del turno" },
      { tag: "{hora}", label: "Horario actual" },
      { tag: "{plan}", label: "Nombre del plan" },
    ],
  },
  {
    key: "pago",
    title: "Datos de Pago / Cobro",
    category: "Pagos",
    icon: "💳",
    description: "Datos bancarios para transferencia (Alias, CBU, Titular, Banco y monto).",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{monto}", label: "Monto a abonar" },
      { tag: "{alias}", label: "Alias bancario" },
      { tag: "{cbu}", label: "CBU" },
      { tag: "{titular}", label: "Titular de cuenta" },
      { tag: "{banco}", label: "Nombre del banco" },
      { tag: "{datos_bancarios}", label: "Bloque completo con CBU/Titular/Banco" },
    ],
  },
  {
    key: "comprobante",
    title: "Comprobante / Recibo de Pago",
    category: "Pagos",
    icon: "🧾",
    description: "Desglose formal de pago, seña recibida y saldo pendiente con datos de transferencia.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{plan}", label: "Plan contratado" },
      { tag: "{fecha}", label: "Fecha del turno" },
      { tag: "{hora}", label: "Horario" },
      { tag: "{total}", label: "Monto total ($)" },
      { tag: "{abonado}", label: "Monto abonado / seña ($)" },
      { tag: "{saldo}", label: "Saldo pendiente ($)" },
      { tag: "{alias}", label: "Alias bancario" },
      { tag: "{detalle_pago_saldo}", label: "Bloque de datos si hay saldo pendiente" },
    ],
  },
  {
    key: "ubicacion",
    title: "Ubicación y Cómo Llegar",
    category: "Turnos",
    icon: "📍",
    description: "Dirección física exacta en Plottier y enlace a Google Maps.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{ubicacion}", label: "Dirección del estudio" },
      { tag: "{maps_url}", label: "Link de Google Maps" },
    ],
  },
  {
    key: "renovacion",
    title: "Renovación de Pack",
    category: "Fidelización",
    icon: "🌟",
    description: "Aviso y felicitaciones para alumnos que completan sus sesiones para que renueven.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{plan}", label: "Plan actual" },
      { tag: "{monto}", label: "Tarifa del plan" },
    ],
  },
  {
    key: "reactivacion",
    title: "Reactivación de Alumnos",
    category: "Fidelización",
    icon: "💬",
    description: "Mensaje del CRM para alumnos inactivos sin sesiones recientes.",
    availableVars: [
      { tag: "{nombre}", label: "Nombre del alumno" },
      { tag: "{fecha_ultima}", label: "Fecha de última sesión" },
      { tag: "{texto_ultima_fecha}", label: "Párrafo con la última fecha si está disponible" },
    ],
  },
  {
    key: "giftcard",
    title: "Voucher / Gift Card Digital",
    category: "Vouchers",
    icon: "🎁",
    description: "Mensaje para compartir una Gift Card con código de canje e instrucciones.",
    availableVars: [
      { tag: "{destinatario}", label: "Nombre del agasajado" },
      { tag: "{remitente}", label: "Nombre de quien regala" },
      { tag: "{plan}", label: "Experiencia o plan" },
      { tag: "{monto}", label: "Monto o precio" },
      { tag: "{codigo}", label: "Código de canje" },
      { tag: "{mensaje_personalizado}", label: "Dedicatoria personalizada" },
    ],
  },
];

export function MensajesTab({
  messageTemplates,
  onSaveMessageTemplates,
  bankConfig,
  saveStatus,
}: MensajesTabProps) {
  const [formData, setFormData] = useState<MessageTemplatesConfig>(() => ({
    ...DEFAULT_MESSAGE_TEMPLATES,
    ...messageTemplates,
  }));

  const [activeKey, setActiveKey] = useState<TemplateKey>("confirmar");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Cuando llegan las plantillas guardadas (servidor) o se guardan, el
  // formulario pasa a mostrar esas. Antes `...prev` iba último y pisaba lo
  // guardado con lo viejo que tenía el form, por eso al recargar "volvía".
  React.useEffect(() => {
    setFormData({
      ...DEFAULT_MESSAGE_TEMPLATES,
      ...messageTemplates,
    });
  }, [messageTemplates]);

  const activeMeta = useMemo(() => {
    return (
      TEMPLATES_META.find((m) => m.key === activeKey) || TEMPLATES_META[0]
    );
  }, [activeKey]);

  // Compute sample preview text
  const previewText = useMemo(() => {
    const bank = bankConfig || DEFAULT_BANK_CONFIG;
    const template = formData[activeKey] || DEFAULT_MESSAGE_TEMPLATES[activeKey];

    const sampleVars: Record<string, string> = {
      nombre: "Franco Riquero",
      plan: "1 Sesión Individual",
      fecha: new Date().toISOString().split("T")[0],
      hora: "18:00",
      dia_relativo: "hoy",
      monto: "$35.000",
      alias: bank.alias || "PRAVILO.ARG",
      cbu: bank.cbu || "0000003100012345678901",
      titular: bank.titular || "Juan Ignacio Garrafa",
      banco: bank.banco || "Banco Galicia",
      datos_bancarios: `🔢 *CBU:* ${bank.cbu || "0000003100012345678901"}\n👤 *Titular:* ${bank.titular || "Juan Ignacio Garrafa"}\n🏦 *Banco:* ${bank.banco || "Banco Galicia"}\n`,
      ubicacion: LOCATION,
      maps_url: GOOGLE_MAPS_URL,
      review_url: GOOGLE_WRITE_REVIEW_URL,
      destinatario: "Martín Benítez",
      remitente: "Carla Gómez",
      codigo: "PRAV-7X9Q",
      mensaje_personalizado: `💌 *Mensaje:* "¡Que disfrutes mucho de la descompresión fascial!"\n`,
      fecha_ultima: "15/09/2026",
      texto_ultima_fecha: "Vi que tu última sesión fue el 15/09/2026. ¿Cómo te venís sintiendo de la espalda y movilidad en estos días?\n\n",
      total: "$35.000",
      abonado: "$15.000",
      saldo: "$20.000",
      detalle_pago_saldo: `💳 *Datos para transferir el saldo:*\n• *Alias:* ${bank.alias || "PRAVILO.ARG"}\n• *Titular:* ${bank.titular || "Juan Ignacio Garrafa"}\n\n_El saldo también puede abonarse en efectivo el día de la sesión._\n\n`,
    };

    return interpolateMessageTemplate(template, sampleVars);
  }, [formData, activeKey, bankConfig]);

  const handleInsertVar = (varTag: string) => {
    setFormData((prev) => ({
      ...prev,
      [activeKey]: (prev[activeKey] || "") + (prev[activeKey]?.endsWith(" ") ? "" : " ") + varTag + " ",
    }));
  };

  const handleResetCurrent = () => {
    if (confirm(`¿Restaurar la plantilla "${activeMeta.title}" a su versión original predeterminada?`)) {
      setFormData((prev) => ({
        ...prev,
        [activeKey]: DEFAULT_MESSAGE_TEMPLATES[activeKey],
      }));
    }
  };

  const handleResetAll = () => {
    if (
      confirm(
        "¿Restaurar TODAS las plantillas de mensajes a sus textos predeterminados de fábrica?",
      )
    ) {
      setFormData({ ...DEFAULT_MESSAGE_TEMPLATES });
    }
  };

  const handleSave = () => {
    onSaveMessageTemplates(formData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const filteredMeta = useMemo(() => {
    if (activeCategory === "todos") return TEMPLATES_META;
    return TEMPLATES_META.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Header */}
      <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="text-xs font-condensed font-bold uppercase tracking-wider text-accent-text">
              Centro de Mensajería & WhatsApp
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-condensed uppercase tracking-tight text-foreground mt-1">
            Plantillas de Mensajes & Automatizaciones
          </h2>
          <p className="text-xs sm:text-sm text-muted font-sans mt-1 max-w-2xl">
            Personalizá los textos que el estudio envía por WhatsApp a los alumnos. Podés usar variables entre llaves (como <code className="text-accent-text">{"{nombre}"}</code>) que se reemplazan automáticamente con los datos de cada turno.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-2.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-xs font-condensed font-bold uppercase tracking-wider text-muted hover:text-rose-400 transition-colors"
          >
            Restaurar Todo
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-shiny px-6 py-2.5 rounded-xl bg-accent hover:opacity-95 text-accent-foreground text-xs font-condensed font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-accent/20 transition-all"
          >
            <svg
              className="w-4 h-4 fill-none stroke-current stroke-2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {(showSavedToast || saveStatus) && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-condensed font-bold uppercase tracking-wider flex items-center justify-between shadow-lg">
          <span>✓ {saveStatus || "Plantillas y automatizaciones guardadas correctamente en la nube."}</span>
          <button
            onClick={() => setShowSavedToast(false)}
            className="text-emerald-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* AUTOMATIONS CARD */}
      <div className="p-6 rounded-3xl bg-surface border border-accent/30 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="text-lg">⚡</span>
          <h3 className="text-base font-black font-condensed uppercase tracking-tight text-foreground">
            Automatizaciones Inteligentes de Envío
          </h3>
          <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-condensed font-bold uppercase tracking-wider bg-accent/20 text-accent-text border border-accent/30">
            Recomendado Activo
          </span>
        </div>

        <p className="text-xs text-muted font-sans mt-3 mb-5">
          Configurá los disparadores automáticos para ahorrar tiempo en la gestión diaria. Cuando realices una acción en el panel de turnos, el sistema te preparará el mensaje exacto para enviar con un solo toque.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Automation 1: Google Review upon Session Realizada */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-border flex items-start gap-4 hover:border-amber-400/40 transition-colors">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 text-xl shrink-0">
              ⭐
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black font-condensed uppercase text-foreground">
                  Sugerir Pedir Reseña Google
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoPromptReviewOnComplete !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoPromptReviewOnComplete: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-raised peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 border border-border"></div>
                </label>
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Al marcar un turno como <strong>&ldquo;Realizado&rdquo;</strong> (sesión completada), se abre automáticamente el borrador de WhatsApp para enviarle la solicitud de reseña en Google con su link directo.
              </p>
            </div>
          </div>

          {/* Automation 2: Turno Confirmado */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-border flex items-start gap-4 hover:border-emerald-400/40 transition-colors">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xl shrink-0">
              📩
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black font-condensed uppercase text-foreground">
                  Confirmación Automática de Turno
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoPromptConfirmOnConfirm !== false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoPromptConfirmOnConfirm: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-raised peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 border border-border"></div>
                </label>
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Al cambiar el estado de un turno a <strong>&ldquo;Confirmado&rdquo;</strong>, abre el borrador de confirmación con día, hora y recomendaciones de vestimenta listos para mandar por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TEMPLATES WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Template Selector */}
        <div className="lg:col-span-4 p-4 rounded-3xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between px-2 pt-1">
            <h4 className="text-xs font-black font-condensed uppercase tracking-wider text-muted">
              Plantillas Disponibles ({TEMPLATES_META.length})
            </h4>
            <div className="flex gap-1">
              {["todos", "Turnos", "Pagos", "Fidelización"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-condensed uppercase px-2 py-0.5 rounded-lg transition-colors ${
                    activeCategory === cat
                      ? "bg-accent text-accent-foreground font-bold"
                      : "text-muted hover:text-foreground hover:bg-surface-raised"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredMeta.map((item) => {
              const isSelected = activeKey === item.key;
              const isDefault =
                formData[item.key] === DEFAULT_MESSAGE_TEMPLATES[item.key];

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveKey(item.key)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? "bg-surface-raised border-accent shadow-md text-foreground"
                      : "bg-surface hover:bg-surface-raised border-border text-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-xl p-1 rounded-xl bg-surface shrink-0">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-condensed font-bold uppercase tracking-wide truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                          isDefault
                            ? "bg-white/[0.04] text-muted"
                            : "bg-amber-500/20 text-amber-300 font-bold"
                        }`}
                      >
                        {isDefault ? "Predeterminado" : "Personalizado"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Editor + Live WhatsApp Preview */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Template Editor Box */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeMeta.icon}</span>
                <div>
                  <h3 className="text-lg font-black font-condensed uppercase tracking-tight text-foreground">
                    {activeMeta.title}
                  </h3>
                  <p className="text-xs text-muted font-sans">
                    {activeMeta.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetCurrent}
                className="self-start sm:self-auto text-xs text-muted hover:text-amber-300 underline font-condensed uppercase tracking-wider"
              >
                Restaurar texto original
              </button>
            </div>

            {/* Quick Variable Insertion Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-condensed font-bold uppercase tracking-wider text-muted block">
                Variables disponibles (hacé clic para insertar en el texto):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeMeta.availableVars.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVar(v.tag)}
                    title={`Insertar ${v.label}`}
                    className="px-2.5 py-1 rounded-xl bg-surface-raised hover:bg-accent/20 border border-border hover:border-accent/40 text-foreground text-xs font-mono font-medium transition-all flex items-center gap-1 group"
                  >
                    <span className="text-accent-text group-hover:text-accent font-bold">
                      +
                    </span>
                    <span>{v.tag}</span>
                    <span className="text-[10px] text-muted font-sans ml-1">
                      ({v.label})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="text-[11px] font-condensed font-bold uppercase tracking-wider text-muted block mb-1.5">
                Cuerpo del Mensaje (admite formato WhatsApp: *negrita*, _cursiva_, ~tachado~)
              </label>
              <textarea
                rows={9}
                value={formData[activeKey] || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [activeKey]: e.target.value,
                  }))
                }
                className="w-full p-4 rounded-2xl bg-surface-raised border border-border text-xs sm:text-sm text-foreground focus:border-accent focus:outline-none font-sans leading-relaxed resize-y"
                placeholder="Escribí el texto de la plantilla..."
              />
            </div>
          </div>

          {/* Live WhatsApp Preview Box */}
          <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 fill-emerald-400 shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span className="text-xs font-black font-condensed uppercase tracking-wider text-foreground">
                  Vista Previa en Tiempo Real en WhatsApp
                </span>
              </div>
              <span className="text-[10px] text-muted font-sans">
                Simulación con datos de ejemplo del alumno
              </span>
            </div>

            {/* Simulated WhatsApp Phone Screen */}
            <div className="rounded-2xl bg-[#0b141a] p-4 border border-[#202c33] shadow-inner relative overflow-hidden">
              {/* WA Chat Header */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#202c33] mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                  PA
                </div>
                <div>
                  <div className="text-xs font-bold text-[#e9edef] leading-none">
                    PRAVILO ARG
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    en línea
                  </div>
                </div>
              </div>

              {/* Chat Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-tr-sm bg-[#005c4b] text-[#e9edef] p-3.5 shadow-md relative text-xs leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {previewText}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]">
                    <span>
                      {new Date().toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[#53bdeb] text-[11px] font-bold">
                      ✓✓
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
