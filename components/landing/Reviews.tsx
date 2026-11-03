import { GOOGLE_REVIEWS } from "@/lib/reviews";
import { GOOGLE_REVIEWS_URL, GOOGLE_WRITE_REVIEW_URL } from "@/lib/constants";

// Reseñas reales de Google en tarjetas que se deslizan con el pulgar.
// Las de una sola palabra no sostienen una cita grande.
const RESENAS = GOOGLE_REVIEWS.filter((r) => r.content.length > 40);

export default function Reviews() {
  return (
    <section id="resenas" className="overflow-hidden bg-paper py-20 text-ink md:py-28">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-5 sm:px-6">
        <div>
          <p className="label text-accent">Reseñas en Google</p>
          <h2 data-split className="display mt-3 text-[16vw] sm:text-8xl">
            Lo dicen ellos
          </h2>
        </div>
        <a
          data-fade
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3"
        >
          <span className="display text-6xl">5.0</span>
          <span className="text-sm font-bold leading-tight">
            <span className="block tracking-[0.15em] text-accent">★★★★★</span>
            Ver en Google Maps →
          </span>
        </a>
      </div>

      <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 sm:px-6 md:mx-auto md:max-w-7xl md:grid md:grid-cols-3 md:overflow-visible">
        {RESENAS.map((r, i) => (
          <figure
            key={r.id}
            data-fade={i * 0.1}
            className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col justify-between rounded-md bg-white p-7 shadow-[0_20px_50px_-30px_rgba(18,23,33,0.35)] md:w-auto md:max-w-none"
          >
            <div>
              <span aria-hidden className="display block text-7xl leading-[0.6] text-accent">
                &ldquo;
              </span>
              <blockquote className="mt-4 text-lg font-semibold leading-snug">{r.content}</blockquote>
            </div>
            <figcaption className="mt-8 flex items-center gap-3 text-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-bold text-white">
                {r.initials}
              </span>
              <span>
                <span className="block font-bold">{r.author}</span>
                <span className="text-ink-soft">Reseña en Google · ★★★★★</span>
              </span>
            </figcaption>
          </figure>
        ))}
        <span aria-hidden className="w-1 shrink-0 md:hidden" />
      </div>

      <div className="mx-auto mt-10 max-w-7xl px-5 sm:px-6">
        <a
          href={GOOGLE_WRITE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-bold uppercase tracking-wider underline decoration-accent decoration-2 underline-offset-4"
        >
          ¿Ya viniste? Dejá tu reseña
        </a>
      </div>
    </section>
  );
}
