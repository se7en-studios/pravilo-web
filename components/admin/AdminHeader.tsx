"use client";

import React from "react";
import Link from "next/link";
import { ScheduleConfig } from "@/lib/availability";
import { BankConfig, Booking, StudentClinicalProfile, downloadFullJSONBackup, exportBookingsToCSV } from "@/lib/bookings";

export type AdminTab =
  | "turnos"
  | "crm"
  | "campanas"
  | "mensajes"
  | "agenda"
  | "analiticas"
  | "galeria"
  | "tarifas"
  | "giftcards"
  | "fidelizacion"
  | "horarios"
  | "banco";

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  currentTime: string;
  bookings: Booking[];
  config: ScheduleConfig;
  bankConfig: BankConfig;
  planPrices: Record<string, string | undefined>;
  clinicalProfiles: Record<string, StudentClinicalProfile>;
  alertCount: number;
  audioEnabled?: boolean;
  onToggleAudio?: () => void;
  onOpenAlerts: () => void;
  onOpenManualBooking: () => void;
  onLogout: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function AdminHeader({
  activeTab,
  setActiveTab,
  currentTime,
  bookings,
  config,
  bankConfig,
  planPrices,
  clinicalProfiles,
  alertCount,
  audioEnabled,
  onToggleAudio,
  onOpenAlerts,
  onOpenManualBooking,
  onLogout,
  onImportBackup,
  fileInputRef,
}: AdminHeaderProps) {
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = tabsScrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollBy({
          left: e.deltaY * 1.3,
          behavior: "auto",
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const tabs = [
    {
      id: "turnos",
      label: "Turnos & Reservas",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      count: bookings.length,
    },
    {
      id: "crm",
      label: "CRM Biomecánico",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "campanas",
      label: "Campañas WA",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      id: "mensajes",
      label: "Plantillas WA",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      id: "agenda",
      label: "Agenda & Calendario",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "analiticas",
      label: "Finanzas & KPIs",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "galeria",
      label: "Galería & Fotos",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "tarifas",
      label: "Tarifas & Planes",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      id: "giftcards",
      label: "Gift Cards & Vouchers",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
    {
      id: "fidelizacion",
      label: "Reseñas Google",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      id: "horarios",
      label: "Horarios & Feriados",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "banco",
      label: "Datos Bancarios",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-border shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Studio Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group transition-transform active:scale-95 shrink-0"
              title="Volver a la landing pública"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-text font-condensed font-black text-lg tracking-wider shadow-lg shadow-accent/15 group-hover:border-accent group-hover:shadow-accent/30 transition-all">
                P
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-sm font-black tracking-wide text-foreground flex items-center gap-1.5 font-condensed uppercase">
                  PRAVILO <span className="text-accent-text">ADMIN</span>
                  <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-text font-condensed font-bold">
                    PRO
                  </span>
                </span>
                <p className="text-[11px] text-muted tracking-tight font-sans">Estudio Biomecánico & Fascial</p>
              </div>
            </Link>

            {/* Live Time Neuquén */}
            {currentTime && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-[11px] text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-condensed font-bold text-foreground text-xs">{currentTime} hs</span>
                <span className="text-muted/70 font-sans">Plottier, NQN</span>
              </div>
            )}

            {/* Live Sync Status Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-400 font-condensed font-bold tracking-wider"
              title="Panel sincronizado en tiempo real (0ms / auto-refresh activo)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">EN VIVO</span>
            </div>
          </div>

          {/* Quick Actions & Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Manual Booking Button */}
            <button
              onClick={onOpenManualBooking}
              className="btn-shiny flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-accent hover:opacity-95 text-accent-foreground font-condensed font-bold uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-accent/25 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Nuevo Turno</span>
            </button>

            {/* Smart Alerts Drawer Trigger */}
            <button
              onClick={onOpenAlerts}
              className={`relative p-2 rounded-xl border transition-all ${
                alertCount > 0
                  ? "bg-accent/15 border-accent/40 text-accent-text hover:bg-accent/25 shadow-lg shadow-accent/15"
                  : "bg-surface-raised border-border text-muted hover:text-foreground hover:bg-surface"
              }`}
              title={alertCount > 0 ? `${alertCount} alertas pendientes` : "Alertas inteligentes"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-condensed font-bold flex items-center justify-center animate-bounce">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Audio & Browser Notification Toggle */}
            {onToggleAudio && (
              <button
                onClick={onToggleAudio}
                className={`p-2 rounded-xl border transition-all ${
                  audioEnabled
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-surface-raised border-border text-muted hover:text-foreground"
                }`}
                title={audioEnabled ? "Avisos sonoros ACTIVADOS (chime 15 min antes)" : "Activar avisos sonoros de turnos"}
              >
                {audioEnabled ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            )}

            {/* Backup Dropdown / Actions */}
            <div className="hidden md:flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border">
              <button
                onClick={() =>
                  downloadFullJSONBackup({
                    bookings,
                    config,
                    planPrices,
                    bankConfig,
                    clinicalProfiles,
                  })
                }
                className="px-2.5 py-1 text-xs font-condensed uppercase tracking-wider text-muted hover:text-accent-text hover:bg-surface rounded-lg transition-colors flex items-center gap-1.5"
                title="Descargar respaldo completo en JSON"
              >
                <svg className="w-3.5 h-3.5 text-accent-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Backup
              </button>

              <button
                onClick={() => exportBookingsToCSV(bookings)}
                className="px-2.5 py-1 text-xs font-condensed uppercase tracking-wider text-muted hover:text-emerald-400 hover:bg-surface rounded-lg transition-colors flex items-center gap-1.5"
                title="Exportar registros a CSV / Excel"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-condensed uppercase tracking-wider text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors flex items-center gap-1.5"
                title="Restaurar backup desde archivo JSON"
              >
                <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportBackup}
                className="hidden"
              />
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-surface-raised hover:bg-rose-500/15 border border-border hover:border-rose-500/40 text-muted hover:text-rose-400 transition-all text-xs font-condensed uppercase tracking-wider flex items-center gap-1"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          ref={tabsScrollRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-border"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-accent/20 text-accent-text border border-accent/40 shadow-md shadow-accent/15"
                    : "text-muted hover:text-foreground hover:bg-surface border border-transparent"
                }`}
              >
                <span className={isActive ? "text-accent-text" : "text-muted/60"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? "bg-accent text-accent-foreground font-bold"
                        : "bg-surface-raised text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
