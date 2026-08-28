import { NextRequest, NextResponse } from "next/server";
import {
  getDBScheduleConfig,
  saveDBScheduleConfig,
  getDBBankConfig,
  saveDBBankConfig,
  getDBPlanPrices,
  saveDBPlanPrices,
  getDBClinicalProfiles,
  saveDBClinicalProfiles,
  getDBGiftCards,
  saveDBGiftCards,
  getDBGalleryImages,
  saveDBGalleryImages,
} from "@/lib/cloudStorage";
import { isAdminRequest, isValidAdminPin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * GET público: solo lo que la web pública necesita (horarios, tarifas,
 * galería). Con credenciales de admin devuelve además los datos sensibles
 * (datos bancarios, fichas clínicas, gift cards).
 */
export async function GET(req: NextRequest) {
  try {
    const [config, planPrices, galleryImages] = await Promise.all([
      getDBScheduleConfig(),
      getDBPlanPrices(),
      getDBGalleryImages(),
    ]);

    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { ok: true, config, planPrices, galleryImages },
        { headers: NO_STORE },
      );
    }

    const [bankConfig, clinicalProfiles, giftCards] = await Promise.all([
      getDBBankConfig(),
      getDBClinicalProfiles(),
      getDBGiftCards(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        config,
        bankConfig,
        planPrices,
        clinicalProfiles,
        giftCards,
        galleryImages,
      },
      { headers: NO_STORE },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Error al leer la configuración",
      },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      config,
      bankConfig,
      planPrices,
      clinicalProfiles,
      giftCards,
      galleryImages,
      pin,
    } = body;

    // Escrituras de configuración: SIEMPRE requieren credenciales de admin
    // (header x-admin-pin, o `pin` en el body para compatibilidad).
    if (!isAdminRequest(req) && !isValidAdminPin(pin)) {
      return NextResponse.json(
        { ok: false, error: "No autorizado. Volvé a iniciar sesión en el panel." },
        { status: 401, headers: NO_STORE },
      );
    }

    const promises: Promise<boolean>[] = [];

    if (config && Array.isArray(config.days)) {
      promises.push(saveDBScheduleConfig(config));
    }
    if (bankConfig && typeof bankConfig === "object") {
      promises.push(saveDBBankConfig(bankConfig));
    }
    if (planPrices && typeof planPrices === "object") {
      promises.push(saveDBPlanPrices(planPrices));
    }
    if (clinicalProfiles && typeof clinicalProfiles === "object") {
      promises.push(saveDBClinicalProfiles(clinicalProfiles));
    }
    if (giftCards && Array.isArray(giftCards)) {
      promises.push(saveDBGiftCards(giftCards));
    }
    if (galleryImages && Array.isArray(galleryImages)) {
      promises.push(saveDBGalleryImages(galleryImages));
    }

    const results = await Promise.all(promises);
    if (results.some((ok) => !ok)) {
      return NextResponse.json(
        { ok: false, error: "No se pudo guardar la configuración" },
        { status: 500 },
      );
    }

    const [
      updatedConfig,
      updatedBank,
      updatedPrices,
      updatedClinical,
      updatedGiftCards,
      updatedGalleryImages,
    ] = await Promise.all([
      getDBScheduleConfig(),
      getDBBankConfig(),
      getDBPlanPrices(),
      getDBClinicalProfiles(),
      getDBGiftCards(),
      getDBGalleryImages(),
    ]);

    return NextResponse.json({
      ok: true,
      config: updatedConfig,
      bankConfig: updatedBank,
      planPrices: updatedPrices,
      clinicalProfiles: updatedClinical,
      giftCards: updatedGiftCards,
      galleryImages: updatedGalleryImages,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Error al guardar",
      },
      { status: 500 },
    );
  }
}
