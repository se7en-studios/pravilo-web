"use client";

import React, { useRef, useState, useEffect } from "react";

interface ConsentSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentPhone: string;
  existingSignature?: string;
  onSaveConsent: (signatureBase64: string, signedDate: string) => void;
}

export function ConsentSignatureModal({
  isOpen,
  onClose,
  studentName,
  studentPhone,
  existingSignature,
  onSaveConsent,
}: ConsentSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [checkHealth1, setCheckHealth1] = useState(true);
  const [checkHealth2, setCheckHealth2] = useState(true);
  const [checkTerms, setCheckTerms] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setHasDrawn(false);

    // Give time to render canvas in DOM
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle high DPI
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);

      ctx.strokeStyle = "#f2f4f7";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (existingSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasDrawn(true);
        };
        img.src = existingSignature;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, existingSignature]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert("Por favor estampe la firma antes de guardar.");
      return;
    }

    if (!checkHealth1 || !checkHealth2 || !checkTerms) {
      alert("Es necesario aceptar todas las declaraciones de salud y consentimiento.");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    const nowStr = new Date().toISOString().split("T")[0];
    onSaveConsent(dataUrl, nowStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl text-foreground animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-text">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black font-condensed uppercase tracking-tight text-foreground">
                Consentimiento Informado & Firma
              </h3>
              <p className="text-xs text-muted font-sans">
                {studentName} • {studentPhone || "Sin teléfono"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Declaraciones Médicas */}
        <div className="space-y-3 p-4 rounded-xl bg-surface-raised border border-border text-xs">
          <span className="text-[10px] font-condensed font-bold uppercase tracking-wider text-accent-text block">
            Declaración Jurada de Salud Biomecánica:
          </span>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkHealth1}
              onChange={(e) => setCheckHealth1(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span className="text-muted font-sans leading-relaxed">
              Declaro no poseer marcapasos cardíacos, osteoporosis severa o prótesis incompatibles con tracción axial tridimensional.
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkHealth2}
              onChange={(e) => setCheckHealth2(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span className="text-muted font-sans leading-relaxed">
              He informado sobre antecedentes de hernias discales, cirugías recientes o dolor neuropático agudo.
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkTerms}
              onChange={(e) => setCheckTerms(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            <span className="text-muted font-sans leading-relaxed">
              Acepto los términos de la metodología PRAVILO ARG y autorizo el protocolo de suspensión gradual.
            </span>
          </label>
        </div>

        {/* Canvas Signature Pad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-condensed font-bold uppercase tracking-wider text-muted">
              Firma Manuscrita del Alumno (Touch o Mouse) *
            </label>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-condensed uppercase tracking-wider text-muted hover:text-accent-text underline"
            >
              Limpiar Firma
            </button>
          </div>

          <div className="relative rounded-2xl bg-surface-raised border border-border overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 cursor-crosshair touch-none"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-muted/40 font-condensed uppercase tracking-wider">
                ✍️ Estampe su firma aquí con el dedo o mouse
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-condensed font-bold uppercase text-muted hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-shiny px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-condensed font-bold uppercase tracking-wider text-xs shadow-lg shadow-accent/25 hover:opacity-95 active:scale-95 transition-all"
          >
            Guardar Firma & Consentimiento
          </button>
        </div>
      </div>
    </div>
  );
}
