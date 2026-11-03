"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import BookingWizard from "@/components/BookingWizard";
import { LOCATION, whatsappLink } from "@/lib/constants";

type NavItem = { href: string; label: string };

// Transparente sobre el video del hero; blanca apenas se scrollea. El menú
// del celu es una cortina roja con los links en tipografía de afiche.
export default function SiteHeader({ nav }: { nav: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) {
      gsap.fromTo(
        el,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.inOut" },
      );
      gsap.fromTo(
        el.querySelectorAll("[data-menu-item]"),
        { yPercent: 110 },
        { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.05, delay: 0.3 },
      );
    }
  }, [open]);

  const light = solid && !open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          light ? "bg-white text-ink shadow-[0_1px_0_rgba(18,23,33,0.08)]" : "bg-transparent text-white"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" aria-label="PRAVILO ARG, inicio" onClick={() => setOpen(false)} className="flex h-11 items-center">
            <Image
              src={light ? "/images/logo-navy.png" : "/images/logo-transparent.png"}
              alt="PRAVILO ARG"
              width={light ? 918 : 900}
              height={light ? 294 : 176}
              priority
              className={light ? "h-9 w-auto" : "h-7 w-auto"}
            />
          </a>

          <nav className="hidden items-center gap-7 text-sm font-bold uppercase tracking-wider lg:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="opacity-80 transition-opacity hover:opacity-100">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <BookingWizard buttonText="Reservar" className={`btn h-11 px-4 py-0 text-xs ${open ? "btn-white" : "btn-red"}`} />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="relative flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span
                className={`absolute h-[2.5px] w-6 bg-current transition-transform duration-500 ${
                  open ? "rotate-45" : "-translate-y-[5px]"
                }`}
              />
              <span
                className={`absolute h-[2.5px] w-6 bg-current transition-transform duration-500 ${
                  open ? "-rotate-45" : "translate-y-[5px]"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menuRef}
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-accent px-5 pb-8 pt-24 text-white ${
          open ? "" : "pointer-events-none invisible"
        }`}
      >
        <ul>
          {nav.map((item) => (
            <li key={item.href} className="line-mask">
              <a
                data-menu-item
                href={item.href}
                onClick={() => setOpen(false)}
                className="display block py-1 text-[15vw]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="space-y-4 text-sm text-white/80">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-white w-full"
          >
            Escribinos por WhatsApp
          </a>
          <p>{LOCATION}</p>
        </div>
      </div>
    </>
  );
}
