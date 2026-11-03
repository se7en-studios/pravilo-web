"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Cinta roja de beneficios. Corre sola y acelera (y se inclina) con la
// velocidad del scroll; cambia de sentido según subas o bajes.
export default function VelocityMarquee({ words }: { words: string[] }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0;
    let dir = -1;
    let boost = 0;
    const skewTo = gsap.quickTo(el, "skewX", { duration: 0.4, ease: "power3" });

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = self.direction === 1 ? -1 : 1;
        boost = Math.min(Math.abs(v) / 120, 18);
        skewTo(gsap.utils.clamp(-8, 8, -v / 400));
      },
    });

    const half = () => el.scrollWidth / 2;
    const tick = (_t: number, dt: number) => {
      x += dir * (0.06 + boost * 0.02) * dt;
      boost *= 0.92;
      const w = half();
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      gsap.set(el, { x });
      if (boost < 0.2) skewTo(0);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
    };
  }, []);

  const row = [...words, ...words];

  return (
    <div className="overflow-hidden bg-accent py-4 text-white md:py-5" aria-label={words.join(", ")}>
      <div ref={track} className="vel-track" aria-hidden>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((w, i) => (
              <span key={`${k}-${i}`} className="flex items-center">
                <span className={`display px-5 text-5xl md:text-7xl ${i % 2 ? "text-outline" : ""}`}>
                  {w}
                </span>
                <span className="display text-4xl text-white/50 md:text-6xl">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
