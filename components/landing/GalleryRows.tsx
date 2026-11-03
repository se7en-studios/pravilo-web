"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Img = { src: string; alt: string };

// Dos filas de fotos (las que Juan carga desde el panel) que se cruzan en
// sentidos opuestos mientras se scrollea.
export default function GalleryRows({ images }: { images: Img[] }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row, i) => {
        gsap.fromTo(
          row,
          { xPercent: i % 2 ? -18 : 0 },
          {
            xPercent: i % 2 ? 0 : -18,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const half = Math.ceil(images.length / 2);
  const rows = [images.slice(0, half), images.slice(half)];

  return (
    <section ref={root} id="galeria" className="paper overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <p className="label text-accent">El estudio · Plottier</p>
        <h2 data-split className="display mt-3 text-[16vw] sm:text-8xl md:text-9xl">
          Así se entrena
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {rows.map((row, r) => (
          <div key={r} data-row className="flex w-max gap-3 pl-5">
            {[...row, ...row].map((img, n) => (
              <div
                key={`${img.src}-${n}`}
                className={`relative shrink-0 overflow-hidden rounded-md ${
                  (n + r) % 3 === 0 ? "aspect-[4/5] w-56 md:w-80" : "aspect-[5/4] w-72 md:w-[26rem]"
                }`}
              >
                <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 416px, 288px" className="object-cover" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
