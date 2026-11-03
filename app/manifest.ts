import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PRAVILO ARG · Centro de Descompresión & Movilidad",
    short_name: "PRAVILO ARG",
    description:
      "Primer centro de descompresión vertebral, tracción y reeducación miofascial con el método Pravilo en Plottier, Neuquén.",
    start_url: "/",
    display: "standalone",
    background_color: "#121721",
    theme_color: "#a01a1a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
