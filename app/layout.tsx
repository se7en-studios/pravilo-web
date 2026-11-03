import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// Anton: condensada pesada de afiche deportivo, solo para títulos.
// Archivo: grotesca legible para todo el texto corrido.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const title =
  "PRAVILO ARG | Primer Centro Pravilo de Argentina — Plottier, Neuquén";
const description =
  "Entrenamiento y terapia de movilidad con el método Pravilo. Sesiones individuales y personalizadas, adaptadas a todas las edades y niveles, en Plottier, Neuquén.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  alternates: { canonical: SITE_URL },
  keywords: [
    "Pravilo",
    "Pravilo Argentina",
    "Pravilo Neuquén",
    "movilidad",
    "fascia",
    "entrenamiento personalizado",
    "terapia de movimiento",
  ],
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: "PRAVILO ARG",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: "PRAVILO ARG",
  description:
    "Primer centro de descompresión vertebral, tracción y reeducación miofascial con el método Pravilo en Argentina.",
  url: SITE_URL,
  telephone: "+54 9 299 577-5085",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Plottier",
    addressRegion: "Neuquén",
    addressCountry: "AR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -38.9667,
    longitude: -68.2333,
  },
  priceRange: "$$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "28",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "20:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "09:30",
      closes: "17:00",
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${anton.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <WhatsAppFloat />
        <GoogleAnalytics />
      </body>
    </html>
  );
}

