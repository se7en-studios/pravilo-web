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
  getDBMessageTemplates,
  saveDBMessageTemplates,
} from "@/lib/cloudStorage";
import { isValidPin, getRequestPin } from "@/lib/adminAuth";

// config/planPrices/galleryImages are public (consumed by the landing page
// for anyone). bankConfig/clinicalProfiles/giftCards/messageTemplates hold
// sensitive or internal admin data and must never be sent to a request that
// didn't prove the admin PIN.
export async function GET(req: NextRequest) {
  try {
    const pin = getRequestPin(req);
    const pinValid = isValidPin(pin);

    const [config, planPrices, galleryImages] = await Promise.all([
      getDBScheduleConfig(),
      getDBPlanPrices(),
      getDBGalleryImages(),
    ]);

    if (!pinValid) {
      return NextResponse.json({
        ok: true,
        pinValid: false,
        config,
        planPrices,
        galleryImages,
      });
    }

    const [bankConfig, clinicalProfiles, giftCards, messageTemplates] =
      await Promise.all([
        getDBBankConfig(),
        getDBClinicalProfiles(),
        getDBGiftCards(),
        getDBMessageTemplates(),
      ]);

    return NextResponse.json({
      ok: true,
      pinValid: true,
      config,
      bankConfig,
      planPrices,
      clinicalProfiles,
      giftCards,
      galleryImages,
      messageTemplates,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Error al leer la configuración",
      },
      { status: 500 },
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
      messageTemplates,
      pin,
    } = body;

    if (!isValidPin(pin)) {
      return NextResponse.json(
        { ok: false, error: "PIN de administrador incorrecto." },
        { status: 401 },
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
    if (messageTemplates && typeof messageTemplates === "object") {
      promises.push(saveDBMessageTemplates(messageTemplates));
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
      updatedMessageTemplates,
    ] = await Promise.all([
      getDBScheduleConfig(),
      getDBBankConfig(),
      getDBPlanPrices(),
      getDBClinicalProfiles(),
      getDBGiftCards(),
      getDBGalleryImages(),
      getDBMessageTemplates(),
    ]);

    return NextResponse.json({
      ok: true,
      config: updatedConfig,
      bankConfig: updatedBank,
      planPrices: updatedPrices,
      clinicalProfiles: updatedClinical,
      giftCards: updatedGiftCards,
      galleryImages: updatedGalleryImages,
      messageTemplates: updatedMessageTemplates,
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
