import Image from "next/image";
import Link from "next/link";
import BookingWizard from "@/components/BookingWizard";
import { PricingSection } from "@/components/PricingSection";
import MotionRoot from "@/components/landing/MotionRoot";
import SiteHeader from "@/components/landing/SiteHeader";
import VelocityMarquee from "@/components/landing/VelocityMarquee";
import Reviews from "@/components/landing/Reviews";
import GalleryRows from "@/components/landing/GalleryRows";
import Band from "@/components/landing/Band";
import { GOOGLE_REVIEWS } from "@/lib/reviews";
import {
  GOOGLE_REVIEWS_URL,
  INSTAGRAM_URL,
  LOCATION,
  SITE_URL,
  whatsappLink,
} from "@/lib/constants";
import { DEFAULT_GALLERY_IMAGES } from "@/lib/gallery";
import { getServerGalleryImages } from "@/lib/serverStorage";

const NAV = [
  { href: "#metodo", label: "Método" },
  { href: "#objetivos", label: "Objetivos" },
  { href: "#sesion", label: "Tu sesión" },
  { href: "#precio", label: "Precio" },
  { href: "#juan", label: "Juan" },
  { href: "#faq", label: "Preguntas" },
];

const CHIPS = [
  "Sesiones 1 a 1",
  "Sin impacto articular",
  "Para todas las edades",
  "Evaluación inicial incluida",
];

const ORIENTACIONES = [
  {
    id: "deportivo",
    name: "Deportivo",
    kicker: "Entrenamiento · Rendimiento",
    text: "Para entrenar y desarrollar tus capacidades físicas: fuerza, resistencia, movilidad, flexibilidad, control corporal y rendimiento.",
    tags: ["Trabajo isométrico", "Fuerza y control excéntrico", "Movilidad activa"],
    img: "/images/pravilo-practica-plancha-lateral.jpg",
    alt: "Trabajo de fuerza y control en suspensión",
    tag: "bg-accent",
  },
  {
    id: "terapeutico",
    name: "Terapéutico",
    kicker: "Bienestar · Movilidad",
    text: "Para sentirte mejor y cuidar tu cuerpo: movilidad, flexibilidad, postura, relajación y conexión con el propio cuerpo.",
    tags: ["Descompresión articular", "Alivio de sobrecargas", "Conexión mente-cuerpo"],
    img: "/images/pravilo-practica-descompresion-zenital.jpg",
    alt: "Tracción y descompresión en 4 puntos vista desde arriba",
    tag: "bg-brand-blue",
  },
];

const BENEFICIOS = [
  {
    title: "Más movilidad",
    desc: "Rango de movimiento real en hombros, columna y caderas.",
    img: "/images/pravilo-practica-alumna-suspension.jpg",
  },
  {
    title: "Menos compresión",
    desc: "Descompresión intervertebral suave que libera contracturas y presión.",
    img: "/images/pravilo-practica-traccion-horizontal.jpg",
  },
  {
    title: "Mejor postura",
    desc: "Trabajo consciente sobre la alineación y la simetría del cuerpo.",
    img: "/images/pravilo-prioridad-inversion-total.jpg",
  },
  {
    title: "Recuperación activa",
    desc: "Elongación fascial sin impacto, ideal para complementar tu deporte.",
    img: "/images/pravilo-mirror-suspension.jpg",
  },
  {
    title: "Fuerza y control",
    desc: "Más transferencia de fuerza y libertad de movimiento en cualquier disciplina.",
    img: "/images/pravilo-prioridad-suspension-barras.jpg",
  },
  {
    title: "Cabeza liviana",
    desc: "Sensación de claridad y bienestar al terminar la sesión.",
    img: "/images/pravilo-neon-suspension.jpg",
  },
];

const PASOS = [
  {
    title: "Evaluación inicial",
    desc: "Conocemos tu estado físico y tus condiciones actuales, y observamos tu postura.",
    img: "/images/pravilo-prioridad-asistencia-extension.jpg",
    alt: "Juan asistiendo una extensión en suspensión",
  },
  {
    title: "Movilidad y activación",
    desc: "Rutina de movilidad articular y una fase de activación para preparar el cuerpo.",
    img: "/images/pravilo-practica-traccion-vertical.jpg",
    alt: "Elongación axial y apertura de hombros en poleas",
  },
  {
    title: "Máquina PRAVILO",
    desc: "Suspensión y tracción guiadas uno a uno, ajustadas a tu punto de partida.",
    img: "/images/foto-img-3399.jpg",
    alt: "El aparato PRAVILO, estructura de cuerdas y poleas",
  },
];

const CREDENCIALES = [
  "1° instructor de PRAVILO en Argentina",
  "Profesor de Educación Física",
  "Antropometrista Nivel I",
];

const FAQ = [
  {
    q: "¿Para qué sirve PRAVILO?",
    a: "PRAVILO ayuda a mejorar la fuerza, movilidad, flexibilidad, postura, equilibrio y coordinación, promoviendo un cuerpo más funcional, saludable y preparado para la vida diaria.",
  },
  {
    q: "¿Qué hace diferente a PRAVILO?",
    a: "PRAVILO no se enfoca únicamente en entrenar. Busca desarrollar el cuerpo de manera integral, promoviendo movimiento, bienestar, conciencia corporal y una mejor calidad de vida.",
  },
  {
    q: "¿Cómo es una sesión y cuánto dura?",
    a: "Cada sesión comienza con una rutina de movilidad articular y una fase de activación, para después trabajar en la máquina de PRAVILO. La duración es de aproximadamente 60 minutos.",
  },
  {
    q: "¿Cómo es la primera sesión?",
    a: "La primera sesión incluye una evaluación inicial para conocer tu estado físico, tus condiciones actuales y observar tu postura.",
  },
  {
    q: "¿Necesito experiencia o estar en buen estado físico para empezar?",
    a: "No. PRAVILO se adapta a cada persona según su condición física, experiencia, necesidades y objetivos. La evaluación inicial nos permite ajustar el trabajo a tu punto de partida.",
  },
  {
    q: "¿Hay límite de edad?",
    a: "No. PRAVILO puede adaptarse a diferentes edades y niveles de condición física. Lo más importante es realizar una evaluación inicial para adecuar el trabajo a cada persona.",
  },
  {
    q: "¿Qué debo llevar a la sesión?",
    a: "Solo necesitás asistir con ropa cómoda que te permita moverte con libertad y una botella de agua. Nosotros nos encargamos del resto.",
  },
  {
    q: "¿Cuántas veces por semana se recomienda?",
    a: "Generalmente se recomienda entre 2 y 3 sesiones por semana, permitiendo que el cuerpo tenga tiempo para recuperarse y adaptarse. La frecuencia puede variar según cada persona, sus necesidades y sus objetivos.",
  },
  {
    q: "¿Qué esperar después de la primera sesión?",
    a: "Es común sentir mayor movilidad, alivio de tensiones, más conciencia corporal y una sensación de claridad mental y bienestar general.",
  },
  {
    q: "¿Dónde queda el centro?",
    a: `Estamos en ${LOCATION}.`,
  },
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: "PRAVILO ARG",
    description:
      "Primer centro Pravilo de Argentina. Entrenamiento y terapia de movilidad, individual y personalizado.",
    url: SITE_URL,
    telephone: "+5492942564386",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Plottier",
      addressRegion: "Neuquén",
      addressCountry: "AR",
    },
    sameAs: [INSTAGRAM_URL, GOOGLE_REVIEWS_URL],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: String(GOOGLE_REVIEWS.length),
      bestRating: "5",
      worstRating: "1",
    },
    review: GOOGLE_REVIEWS.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author,
      },
      datePublished: "2026-08-20",
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
        bestRating: "5",
      },
      reviewBody: r.content,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  // Falla de I/O transitoria en el storage → galería por defecto
  let serverGallery: ReturnType<typeof getServerGalleryImages> = [];
  try {
    serverGallery = getServerGalleryImages();
  } catch {}
  const gallery = (
    serverGallery && serverGallery.length > 0
      ? serverGallery
      : DEFAULT_GALLERY_IMAGES
  )
    .filter((img) => img.visible !== false)
    .map((img) => ({ src: img.src, alt: img.alt }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <MotionRoot />
      <SiteHeader nav={NAV} />

      <main className="flex-1">
        {/* HERO: video a sangre, titular de afiche */}
        <section id="top" className="relative flex min-h-svh items-end overflow-hidden bg-ink text-white">
          <div data-parallax="8" className="absolute inset-x-0 -inset-y-[8%]">
            <video
              poster="/videos/hero-poster.jpg"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            >
              {/* 720p liviano para datos móviles; el 1080p solo en pantallas grandes */}
              <source src="/videos/hero-720.mp4" type="video/mp4" media="(max-width: 767px)" />
              <source src="/videos/hero-1080.mp4" type="video/mp4" />
            </video>
          </div>
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,12,18,0.88)_0%,rgba(10,12,18,0.4)_45%,rgba(10,12,18,0.15)_75%)]"
          />

          <div className="relative mx-auto w-full max-w-7xl px-5 pb-6 pt-24 sm:px-6 md:pb-14">
            <p data-hero-in className="label inline-flex items-center gap-2 rounded-sm bg-white px-2.5 py-1.5 text-ink">
              <span className="h-2 w-2 bg-accent" />
              1° centro oficial en Argentina
            </p>

            <h1 className="display mt-4 text-[18vw] leading-[0.86] sm:text-[8.5rem] lg:text-[10.5rem]">
              <span className="line-mask block">
                <span data-hero-line className="block">Explorá</span>
              </span>
              <span className="line-mask block">
                <span data-hero-line className="block">tu cuerpo</span>
              </span>
              <span className="line-mask block">
                <span data-hero-line className="block">
                  a otro <span data-hl className="hl">nivel</span>
                </span>
              </span>
            </h1>

            <div className="mt-6 grid gap-5 md:mt-8 md:grid-cols-[1fr_auto] md:items-end">
              <p data-hero-in className="max-w-md text-base font-medium leading-relaxed text-white/90 md:text-lg">
                Sesiones 1 a 1 de suspensión y tracción en Plottier, Neuquén.
                Una propuesta diferente, que tenés que experimentar para
                entender.
              </p>
              <div data-hero-in className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:gap-3">
                <BookingWizard buttonText="Reservá tu sesión" className="btn btn-red w-full sm:w-auto" />
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Escribinos por WhatsApp"
                  className="btn btn-white px-4 sm:px-6"
                >
                  <svg viewBox="0 0 32 32" aria-hidden className="h-5 w-5 fill-current">
                    <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.9A12 12 0 0 0 16 27c6.6 0 12-5.4 12-12S22.6 3 16 3Zm0 21.8c-2 0-3.8-.6-5.3-1.6l-.4-.2-4.6 1.1 1.1-4.5-.2-.4A9.7 9.7 0 0 1 5.3 15C5.3 9.1 10.1 4.3 16 4.3S26.8 9.1 26.8 15 21.9 24.8 16 24.8Zm5.9-8.1c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.5 4.9.8.3 1.4.5 1.8.7.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4Z" />
                  </svg>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>
            </div>

            <a
              data-hero-in
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/85"
            >
              <span className="tracking-[0.15em] text-white">★★★★★</span>
              5.0 en Google
            </a>
          </div>
        </section>

        <VelocityMarquee
          words={["Suspensión", "Tracción", "Descompresión", "Movilidad", "Fuerza", "Postura"]}
        />

        {/* QUÉ ES */}
        <section id="metodo" className="paper overflow-hidden px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <p className="label text-accent">Qué es PRAVILO</p>
              <h2 data-split className="display mt-3 text-[18vw] sm:text-8xl lg:text-9xl">
                Tu peso,
                <br />
                a favor
              </h2>
              <p data-fade className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
                PRAVILO es un método de origen eslavo de entrenamiento y
                recuperación. Un sistema de suspensión y tracción progresiva en
                4 puntos: al trabajar con la gravedad y tu propio peso, se
                libera la presión entre las vértebras y se abren cadenas
                miofasciales que el estiramiento convencional no alcanza.
              </p>
              <ul data-fade className="mt-7 flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <li key={c} className="rounded-sm bg-paper px-3 py-2 text-sm font-bold">
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative h-[118vw] max-h-[680px] sm:h-[640px]">
              <Band className="absolute -left-[30%] top-[18%] h-[70%] w-[160%]" width={64} />
              <div data-img className="absolute right-0 top-0 w-[74%] overflow-hidden rounded-md">
                <div className="relative aspect-[3/4]">
                  <Image
                    src="/images/pravilo-sign-suspension.jpg"
                    alt="Sesión de suspensión frente al cartel de PRAVILO"
                    fill
                    sizes="(min-width: 768px) 36vw, 74vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div
                data-img
                className="absolute bottom-0 left-0 w-[52%] overflow-hidden rounded-md border-[6px] border-white shadow-xl"
              >
                <div className="relative aspect-square">
                  <Image
                    src="/images/pravilo-pulley-tension.jpg"
                    alt="Cuerdas y poleas del aparato en tensión"
                    fill
                    sizes="(min-width: 768px) 26vw, 52vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DOS ORIENTACIONES */}
        <section id="objetivos" className="paper pb-20 md:pb-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <p className="label text-accent">Dos orientaciones · un método</p>
            <h2 data-split className="display mt-3 text-[18vw] sm:text-8xl lg:text-9xl">
              Elegí tu objetivo
            </h2>
            <p data-fade className="mt-4 max-w-md text-lg text-ink-soft">
              No necesitás ser deportista ni tener experiencia previa.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-2 md:grid-cols-2 md:gap-4 md:px-6">
            {ORIENTACIONES.map((o) => (
              <article
                key={o.id}
                data-img
                className="group relative flex min-h-[125vw] flex-col justify-end overflow-hidden text-white md:min-h-[760px] md:rounded-md"
              >
                <Image
                  src={o.img}
                  alt={o.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,12,18,0.92)_0%,rgba(10,12,18,0.55)_45%,transparent_75%)]" />
                <div className="relative p-6 md:p-10">
                  <span className={`label inline-block rounded-sm px-2 py-1 text-white ${o.tag}`}>
                    {o.kicker}
                  </span>
                  <h3 className="display mt-3 text-[15.5vw] sm:text-8xl">{o.name}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/90">{o.text}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {o.tags.map((t) => (
                      <li key={t} className="rounded-sm border border-white/40 px-2.5 py-1 text-xs font-semibold">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BENEFICIOS: sección roja, tarjetas de foto */}
        <section className="overflow-hidden bg-accent py-20 text-white md:py-28">
          <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5 sm:px-6">
            <div>
              <p className="label text-white/75">Beneficios</p>
              <h2 data-split className="display mt-3 text-[18vw] sm:text-8xl lg:text-9xl">
                Lo que ganás
              </h2>
            </div>
            <span className="label hidden text-white/75 sm:block">Deslizá →</span>
          </div>

          <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 sm:px-6 md:mx-auto md:max-w-7xl">
            {BENEFICIOS.map((b, i) => (
              <article
                key={b.title}
                data-fade={i * 0.06}
                className="relative flex aspect-[3/4] w-[78vw] max-w-[22rem] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-md"
              >
                <Image src={b.img} alt="" fill sizes="(min-width: 768px) 352px, 78vw" className="object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,12,18,0.9)_0%,rgba(10,12,18,0.35)_50%,transparent_75%)]" />
                <div className="relative p-6">
                  <span className="display text-5xl text-accent-glow">0{i + 1}</span>
                  <h3 className="display mt-1 text-4xl">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{b.desc}</p>
                </div>
              </article>
            ))}
            <span aria-hidden className="w-2 shrink-0" />
          </div>
        </section>

        {/* TU PRIMERA SESIÓN */}
        <section id="sesion" className="paper px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label text-accent">Tu primera sesión</p>
                <h2 data-split className="display mt-3 text-[18vw] sm:text-8xl lg:text-9xl">
                  60 minutos,
                  <br />
                  1 a 1
                </h2>
              </div>
              <p data-fade className="max-w-xs text-lg text-ink-soft">
                Siempre guiada por Juan. Así se arma la hora:
              </p>
            </div>

            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-5">
              {PASOS.map((p, i) => (
                <li key={p.title}>
                  <div data-img className="relative aspect-[4/3] overflow-hidden rounded-md">
                    <Image src={p.img} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                    <span className="display absolute left-3 top-3 rounded-sm bg-accent px-2.5 pt-1 text-3xl text-white">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 data-fade className="display mt-5 text-5xl">{p.title}</h3>
                  <p data-fade className="mt-2 max-w-sm text-base leading-relaxed text-ink-soft">{p.desc}</p>
                </li>
              ))}
            </ol>

            <div data-fade className="mt-12 grid gap-6 rounded-md bg-paper p-6 sm:grid-cols-2 md:p-8">
              <div>
                <p className="label text-accent">Qué traer</p>
                <p className="mt-2 text-lg font-semibold">Ropa cómoda y una botella de agua. Del resto nos encargamos.</p>
              </div>
              <div>
                <p className="label text-accent">Cada cuánto</p>
                <p className="mt-2 text-lg font-semibold">En general, de 2 a 3 sesiones por semana, según tus objetivos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* JUAN */}
        <section id="juan" className="relative overflow-hidden bg-paper px-5 py-20 text-ink sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div className="relative">
              <Band
                shape="swoop"
                color="var(--brand-blue)"
                width={56}
                className="absolute -left-[40%] top-[30%] h-[60%] w-[140%]"
              />
              <div data-img className="relative aspect-[4/5] overflow-hidden rounded-md">
                <Image
                  src="/images/juan-garrafa-instructor.jpg"
                  alt="Juan I. Garrafa, instructor de PRAVILO ARG"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </div>
            </div>

            <div className="relative z-10">
              <p className="label text-accent">Tu instructor</p>
              <h2 data-split className="display mt-3 text-[19vw] sm:text-8xl lg:text-9xl">
                Juan I.
                <br />
                Garrafa
              </h2>
              <ul data-fade className="mt-6 space-y-2">
                {CREDENCIALES.map((c) => (
                  <li key={c} className="flex items-center gap-3 text-lg font-bold">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent text-white">
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5l4 4 8-9" />
                      </svg>
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
              <blockquote data-fade className="mt-8 border-l-4 border-accent pl-5">
                <p className="text-lg font-semibold leading-snug md:text-xl">
                  &ldquo;Mi interés por PRAVILO surgió a partir de una búsqueda
                  personal. Conviviendo con un dolor crónico, conocí este
                  método mientras buscaba nuevas herramientas para abordar mi
                  propia situación.&rdquo;
                </p>
                <p className="mt-4 text-base leading-relaxed text-ink-soft">
                  De esa experiencia nació PRAVILO ARG: un espacio para quienes
                  buscan otra forma de trabajar sobre su cuerpo, superar sus
                  limitaciones o alcanzar sus objetivos.
                </p>
              </blockquote>
              <a
                data-fade
                href={whatsappLink(
                  "Hola Juan! Me gustaría hacerte una consulta sobre el método PRAVILO.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-red mt-8"
              >
                Escribile a Juan <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </section>

        <PricingSection />
        <Reviews />
        <GalleryRows images={gallery} />

        {/* FAQ */}
        <section id="faq" className="faq paper border-t border-ink/10 px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
            <div>
              <p className="label text-accent">Antes de venir</p>
              <h2 data-split className="display mt-3 text-[18vw] sm:text-8xl">
                Preguntas
              </h2>
            </div>
            <div className="border-t-2 border-ink">
              {FAQ.map((f) => (
                <details key={f.q} className="border-b border-ink/15">
                  <summary className="flex items-center justify-between gap-6 py-5 text-lg font-bold md:text-xl">
                    {f.q}
                    <span className="plus display shrink-0 text-3xl text-accent">+</span>
                  </summary>
                  <p className="pb-6 pr-10 leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CIERRE: foto en rojo */}
        <section id="reservar" className="relative overflow-hidden bg-accent px-5 py-24 text-white sm:px-6 md:py-36">
          <Image
            src="/images/espacio-completo.jpg"
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover opacity-50 mix-blend-multiply"
          />
          <div className="relative mx-auto max-w-7xl">
            <p className="label text-white/80">Primer centro PRAVILO de Argentina</p>
            <h2 data-split className="display mt-4 text-[15.5vw] sm:text-9xl lg:text-[11rem]">
              Descomprimí
              <br />
              tu cuerpo
            </h2>
            <p data-fade className="mt-6 max-w-md text-lg font-medium text-white/90">
              Reservá tu primera sesión: elegís día y horario online.
            </p>
            <div data-fade className="mt-8 flex flex-col gap-3 sm:flex-row">
              <BookingWizard buttonText="Reservá tu sesión" className="btn btn-white" />
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-line text-white"
              >
                Consultar por WhatsApp
              </a>
            </div>

            <div data-fade className="mt-16 grid gap-6 border-t border-white/30 pt-8 sm:grid-cols-3">
              <div>
                <p className="label text-white/70">Dirección</p>
                <p className="mt-2 font-semibold">{LOCATION}</p>
                <a
                  href={GOOGLE_REVIEWS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm text-white/85 underline underline-offset-4 hover:text-white"
                >
                  Abrir en Google Maps
                </a>
              </div>
              <div>
                <p className="label text-white/70">Horarios</p>
                <p className="mt-2 font-semibold">Lunes a sábados, con turno previo</p>
              </div>
              <div>
                <p className="label text-white/70">Instagram</p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center font-semibold hover:underline"
                >
                  @praviloarg
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink px-5 py-10 text-sm text-white/60 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/images/logo-transparent.png"
            alt="PRAVILO ARG"
            width={900}
            height={176}
            className="h-8 w-auto"
          />
          <div className="flex flex-wrap items-center gap-5">
            <span>&copy; {new Date().getFullYear()} PRAVILO ARG</span>
            <Link href="/admin" className="inline-flex min-h-11 items-center transition-colors hover:text-white">
              Acceso administrador
            </Link>
            <a
              href="https://se7endev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-white"
              title="Desarrollado por Se7en Studio"
            >
              <span>Hecho por</span>
              <Image
                src="/images/se7en-studio-logo.png"
                alt="Se7en Studio"
                width={1024}
                height={344}
                className="h-5 w-auto"
              />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
