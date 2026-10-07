import { SITE_URL } from "@/lib/constants";
import { getDBPlanPrices } from "@/lib/cloudStorage";

export async function POST(req: Request) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return Response.json(
      { error: "Mercado Pago todavía no está configurado." },
      { status: 501 },
    );
  }

  const { title } = await req.json();
  if (typeof title !== "string" || title.length > 100) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  // El precio sale de las tarifas guardadas, nunca del cliente: si no,
  // cualquiera podría generarse un link para pagar un pack a $1.
  const prices = await getDBPlanPrices();
  const priceStr = title.includes("12")
    ? prices.pack12
    : title.includes("8")
      ? prices.pack8
      : prices.individual;
  const price = parseInt((priceStr || "").replace(/\D/g, ""), 10);
  if (!price || price <= 0) {
    return Response.json({ error: "Plan sin precio." }, { status: 400 });
  }

  const backUrl = `${SITE_URL}/reserva-confirmada?plan=${encodeURIComponent(title)}&price=${price}`;

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: `PRAVILO ARG — ${title}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: price,
        },
      ],
      back_urls: {
        success: backUrl,
        pending: backUrl,
        failure: SITE_URL,
      },
      auto_return: "approved",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return Response.json(
      { error: data.message ?? "No se pudo iniciar el pago." },
      { status: 502 },
    );
  }

  return Response.json({ init_point: data.init_point });
}
