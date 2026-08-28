# PRAVILO ARG

Landing page del primer centro Pravilo de Argentina (Neuquén). Next.js 16 (App Router) + Tailwind CSS v4.

## Desarrollo local

```bash
npm install
npm run dev
```

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

- `NEXT_PUBLIC_CALENDLY_URL` — link de Calendly (ej: `https://calendly.com/praviloarg/sesion`). Sin esto, los botones de "Reservar" abren WhatsApp directamente en vez del wizard de reserva.
- `NEXT_PUBLIC_GA_ID` — ID de Google Analytics (ej: `G-XXXXXXXXXX`).
- `MP_ACCESS_TOKEN` — Access Token de **Producción** de Mercado Pago (server-only, sin prefijo `NEXT_PUBLIC_`). Sin esto, el paso de pago del wizard muestra un aviso y el usuario elige "Efectivo" en su lugar.
- `ADMIN_PIN` — PIN del panel `/admin` (server-only). Si no se define se usa el valor por defecto `pravilo2026`. El PIN se verifica **en el servidor** (`/api/admin/auth`) y todas las rutas de administración exigen el header `x-admin-pin`.
- `NEXT_PUBLIC_FIREBASE_*` — credenciales de Firebase/Firestore (ver `.env.example`). Con esto configurado, los turnos y la configuración persisten en Firestore (fuente de verdad); sin esto, se usa el fallback a archivos JSON en `data/`.

En producción (Vercel), configurá las mismas variables en **Project Settings → Environment Variables** y hacé un redeploy.

## Persistencia de datos

- **Con Firebase configurado**: Firestore es la fuente de verdad; los JSON de `data/` quedan como cache espejo local. Esto es lo que permite operar el panel en Vercel.
- **Sin Firebase** (desarrollo local): todo se guarda en `data/*.json` (ignorados por git: contienen datos personales de clientes). ⚠️ En hosting serverless el disco es de solo lectura: sin Firestore, el panel responde error 500 honesto al guardar en vez de simular éxito.
- Los endpoints públicos nunca exponen datos de clientes: el wizard usa `/api/availability` (solo fecha/hora/estado) y el GET de configuración pública no incluye datos bancarios, fichas clínicas ni gift cards.

## Wizard de reserva

El botón "Reservar turno" (`components/BookingWizard.tsx`) abre un modal de 3 pasos:

1. **Elegí tu plan** — lista de `lib/plans.ts`.
2. **Elegí día y horario** — widget de Calendly embebido inline (no popup); detecta el evento `calendly.event_scheduled` para habilitar "Continuar".
3. **Resumen y pago** — muestra plan + precio, y deja elegir Efectivo (manda un resumen armado por WhatsApp) o Mercado Pago (crea una preferencia vía `/api/mercadopago/create-preference` y redirige al checkout; al volver, `/reserva-confirmada` ofrece mandar el resumen por WhatsApp).

## Contenido a completar

- **Foto del instructor**: la Galería y el hero ya usan fotos reales del espacio (`public/images/`), pero todavía no hay una foto de Juan — el avatar sigue con sus iniciales.
- **Testimonios**: cuando haya clientes reales, agregar una sección con citas verdaderas (no se incluyeron testimonios inventados).
- **Ubicación exacta**: hoy se pide por WhatsApp además del mapa embebido; falta la dirección puntual del local.
- **Mercado Pago**: falta el `MP_ACCESS_TOKEN` de producción para activar el pago real (ver arriba).

## Deploy

Vercel (cuenta `xfranco199x-5648s-projects`), deploy manual vía `vercel --prod` — la conexión automática GitHub↔Vercel no está activa en esa cuenta.
