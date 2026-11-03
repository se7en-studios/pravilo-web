"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/constants";

export default function WhatsAppFloat() {
  const pathname = usePathname();
  // ponytail: the public "chat with Juan" bubble has no business inside the
  // admin panel, where it overlaps toasts and action buttons.
  // La confirmación de reserva ya tiene su propio botón grande de WhatsApp.
  const hideOnRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/reserva-confirmada");
  const [customPos, setCustomPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  // En la home el hero ya tiene su botón de WhatsApp: la burbuja aparece
  // recién al bajar, así no tapa los botones del primer pantallazo.
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);
  const hidden = isHome && !pastHero && !customPos;
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    moved: boolean;
  } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !elementRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragStartRef.current.moved = true;
      setIsDragging(true);
    }

    if (dragStartRef.current.moved) {
      const rect = elementRef.current.getBoundingClientRect();
      const elWidth = rect.width;
      const elHeight = rect.height;

      // Mantener dentro de los bordes de la pantalla
      const newX = Math.max(
        10,
        Math.min(
          window.innerWidth - elWidth - 10,
          dragStartRef.current.initialLeft + dx,
        ),
      );
      const newY = Math.max(
        10,
        Math.min(
          window.innerHeight - elHeight - 10,
          dragStartRef.current.initialTop + dy,
        ),
      );

      setCustomPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const wasMoved = dragStartRef.current.moved;
    dragStartRef.current = null;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

    // Si solo fue un tap / click sin arrastrar, abrir chat de WhatsApp
    if (!wasMoved) {
      window.open(whatsappLink(), "_blank", "noopener,noreferrer");
    }
  };

  if (hideOnRoute) return null;

  return (
    <aside
      ref={elementRef}
      aria-label="Contacto flotante de WhatsApp"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        customPos
          ? {
              position: "fixed",
              left: `${customPos.x}px`,
              top: `${customPos.y}px`,
              zIndex: 50,
              touchAction: "none",
            }
          : {
              position: "fixed",
              bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
              right: "1.25rem",
              zIndex: 50,
              touchAction: "none",
            }
      }
      aria-hidden={hidden}
      className={`flex items-center gap-2.5 select-none cursor-grab active:cursor-grabbing transition-[transform,opacity] duration-300 ${
        hidden ? "pointer-events-none translate-y-6 opacity-0" : ""
      } ${isDragging ? "scale-105 opacity-90" : "hover:scale-105"}`}
      title="Mantené presionado para mover o tocá para chatear por WhatsApp"
    >
      {/* Tooltip / Badge sutil solo en desktop */}
      <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border-highlight bg-surface-raised/95 px-3.5 py-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-foreground shadow-xl backdrop-blur-md pointer-events-none">
        <span>Escribile a Juan</span>
      </span>

      {/* Botón Circular Verde WhatsApp */}
      <div
        aria-label="Escribinos por WhatsApp al centro PRAVILO"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_25px_-4px_rgba(37,211,102,0.6)] transition-all duration-300 active:scale-95"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />
        <svg
          viewBox="0 0 32 32"
          className="relative h-7 w-7 fill-white transition-transform group-hover:rotate-6 pointer-events-none"
        >
          <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.696 4.61 1.899 6.484L4 29l7.708-1.855A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm0 21.75c-1.972 0-3.8-.575-5.34-1.566l-.383-.243-4.573 1.1 1.12-4.457-.25-.394A9.71 9.71 0 0 1 5.25 15c0-5.937 4.813-10.75 10.751-10.75S26.75 9.063 26.75 15 21.938 24.75 16.001 24.75Zm5.893-8.06c-.322-.161-1.906-.94-2.202-1.047-.295-.108-.51-.161-.725.161-.214.322-.833 1.047-1.021 1.262-.188.214-.376.242-.698.081-.322-.161-1.36-.501-2.591-1.598-.958-.854-1.605-1.909-1.793-2.231-.188-.322-.02-.496.141-.656.145-.144.322-.376.483-.564.161-.188.214-.322.322-.537.107-.214.054-.402-.027-.564-.081-.161-.725-1.747-.994-2.393-.262-.63-.528-.545-.725-.555l-.618-.011c-.214 0-.564.081-.859.402-.295.322-1.128 1.102-1.128 2.688 0 1.586 1.155 3.118 1.316 3.332.161.214 2.273 3.47 5.508 4.866.77.332 1.37.531 1.838.679.772.246 1.475.211 2.031.128.62-.093 1.906-.779 2.174-1.531.268-.752.268-1.397.188-1.531-.08-.135-.295-.215-.618-.376Z" />
        </svg>
      </div>
    </aside>
  );
}
