"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
// En el celu la barra del navegador aparece y desaparece al scrollear: no
// recalcular todo por eso (evita saltos).
ScrollTrigger.config({ ignoreMobileResize: true });

// Un solo lugar para el movimiento de la página. Las secciones son server
// components y piden animación con atributos:
//   data-hero-line  → líneas del titular principal, entran al cargar
//   data-hl         → bloque rojo que se "pinta" detrás de una palabra
//   data-split      → títulos que entran línea por línea desde una máscara
//   data-fade       → bloques que suben y aparecen (valor = demora en s)
//   data-img        → foto que se destapa de abajo hacia arriba con zoom
//   data-parallax=n → desplazamiento vertical suave mientras se scrollea
//   data-draw       → banda curva que se dibuja con el scroll
export default function MotionRoot() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    const raf = (t: number) => lenis?.raf(t * 1000);
    if (!reduce) {
      lenis = new Lenis({
        autoRaf: false,
        anchors: { offset: -64 },
        // Los modales (reserva, voucher, menú) scrollean solos
        prevent: (node) => !!node.closest(".fixed"),
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    let ctx: gsap.Context | null = null;
    // En desarrollo React monta dos veces: si este efecto ya se limpió, no
    // hay que crear animaciones duplicadas (la segunda iría de 0 a 0).
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        if (reduce) return;

        // Entrada del hero: líneas que suben, después el bloque rojo
        const hero = gsap.timeline({ delay: 0.15 });
        hero
          .from("[data-hero-line]", {
            yPercent: 110,
            duration: 1,
            ease: "expo.out",
            stagger: 0.1,
          })
          .fromTo(
            "[data-hl]",
            { "--hl": 0 },
            { "--hl": 1, duration: 0.7, ease: "expo.inOut" },
            0.35,
          )
          .from(
            "[data-hero-in]",
            { y: 24, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.08 },
            0.5,
          );

        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          const split = SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "split-mask",
          });
          gsap.from(split.lines, {
            yPercent: 110,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) => {
          gsap.from(el, {
            y: 40,
            autoAlpha: 0,
            duration: 0.9,
            ease: "expo.out",
            delay: Number(el.dataset.fade) || 0,
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-img]").forEach((el) => {
          const media = el.querySelector("img, video");
          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
          tl.from(el, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: 1.1,
            ease: "expo.inOut",
          });
          if (media) {
            tl.from(media, { scale: 1.35, duration: 1.4, ease: "expo.out" }, 0.15);
          }
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = Number(el.dataset.parallax) || 12;
          gsap.fromTo(
            el,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: "none",
              scrollTrigger: {
                trigger: el.parentElement ?? el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });

        gsap.utils.toArray<SVGPathElement>("[data-draw]").forEach((path) => {
          const len = path.getTotalLength();
          gsap.fromTo(
            path,
            { strokeDasharray: len, strokeDashoffset: len },
            {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: path.closest("section") ?? path,
                start: "top 85%",
                end: "center 40%",
                scrub: 0.6,
              },
            },
          );
        });
      });
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
      gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}
