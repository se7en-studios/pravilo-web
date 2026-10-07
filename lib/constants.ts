export const SITE_URL = "https://www.pravilo.com.ar";

export const WHATSAPP_NUMBER = "5492994567662";
export const WHATSAPP_DEFAULT_MESSAGE =
  "Hola! Quiero saber más sobre PRAVILO ARG y reservar una sesión.";
export const whatsappLink = (message: string = WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// "5492994567662" -> "+54 9 299 456-7662", solo para mostrarlo en pantalla
// (los links de wa.me siguen usando WHATSAPP_NUMBER tal cual).
export const WHATSAPP_DISPLAY_NUMBER = (() => {
  const digits = WHATSAPP_NUMBER.replace(/\D/g, "");
  const match = digits.match(/^54(9)?(\d{3})(\d{3})(\d{4})$/);
  if (!match) return `+${digits}`;
  const [, mobile, area, part1, part2] = match;
  return `+54${mobile ? " 9" : ""} ${area} ${part1}-${part2}`;
})();

export const INSTAGRAM_URL = "https://www.instagram.com/praviloarg/";

export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/PRAVILO+ARGENTINA/@-38.944887,-68.2206435,17z/data=!4m16!1m9!3m8!1s0x960bcb7e8c328b6f:0x5f4f8d8bde3cb669!2sPRAVILO+ARGENTINA!8m2!3d-38.944887!4d-68.2206435!9m1!1b1!16s%2Fg%2F11zhfxc50s!3m5!1s0x960bcb7e8c328b6f:0x5f4f8d8bde3cb669!8m2!3d-38.944887!4d-68.2206435!16s%2Fg%2F11zhfxc50s?hl=es-AR";

export const GOOGLE_WRITE_REVIEW_URL =
  "https://www.google.com/maps/place/PRAVILO+ARGENTINA/@-38.944887,-68.2206435,17z/data=!4m8!3m7!1s0x960bcb7e8c328b6f:0x5f4f8d8bde3cb669!8m2!3d-38.944887!4d-68.2206435!9m1!1b1!16s%2Fg%2F11zhfxc50s?hl=es-AR";

// Short link (maps.app.goo.gl) used to run on Firebase Dynamic Links, which
// Google shut down in 2025 — every "maps.app.goo.gl/..." link now 404s
// ("Dynamic Link Not Found"). Use Google's documented, stable Maps URL API
// instead: https://developers.google.com/maps/documentation/urls/get-started
export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=-38.944887,-68.2206435";

export const LOCATION_SHORT = "Plottier, Neuquén";
export const LOCATION = "Código 600 N°853, Plottier, Neuquén";
export const MAPS_EMBED_SRC =
  "https://www.google.com/maps?q=-38.944887,-68.2206435&hl=es&z=17&output=embed";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
