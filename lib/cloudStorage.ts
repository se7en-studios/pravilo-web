import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDB, isFirebaseConfigured } from "./firebaseConfig";
import {
  Booking,
  BankConfig,
  DEFAULT_BANK_CONFIG,
  GiftCard,
  StudentClinicalProfile,
  MessageTemplatesConfig,
  DEFAULT_MESSAGE_TEMPLATES,
} from "./bookings";
import { DEFAULT_SCHEDULE_CONFIG, ScheduleConfig } from "./availability";
import { GalleryImageItem, DEFAULT_GALLERY_IMAGES } from "./gallery";
import {
  getServerBookings,
  saveServerBookings,
  getServerScheduleConfig,
  saveServerScheduleConfig,
  getServerBankConfig,
  saveServerBankConfig,
  getServerPlanPrices,
  saveServerPlanPrices,
  getServerClinicalProfiles,
  saveServerClinicalProfiles,
  getServerGiftCards,
  saveServerGiftCards,
  getServerGalleryImages,
  saveServerGalleryImages,
  getServerMessageTemplates,
  saveServerMessageTemplates,
  DEFAULT_PLAN_PRICES,
} from "./serverStorage";

// ponytail: Firestore's setDoc() rejects any field whose value is literally
// `undefined` (it throws invalid-argument). Optional booking/config fields
// are routinely built as `value ?? undefined`, so every write needs this.
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// ----------------- BOOKINGS -----------------
export async function getDBBookings(): Promise<Booking[]> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerBookings();
  }

  try {
    const colRef = collection(db, "bookings");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const bookings: Booking[] = [];
    snapshot.forEach((d) => {
      bookings.push({ id: d.id, ...(d.data() as Omit<Booking, "id">) });
    });

    // Mirror to local disk cache (best-effort only, never authoritative)
    saveServerBookings(bookings);
    return bookings;
  } catch (err) {
    // ponytail: Firestore is configured and is the source of truth here.
    // Falling back to the disk cache on error used to resurrect stale or
    // fabricated sample bookings whenever Firestore had a transient error
    // (e.g. a missing composite index for this orderBy query). Surface the
    // real error instead so the admin sees a failure, not fake data.
    console.error("Error reading bookings from Firestore:", err);
    throw err;
  }
}

export async function saveDBBookings(bookings: Booking[]): Promise<boolean> {
  // Always update local disk cache
  const fsOk = saveServerBookings(bookings);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return fsOk;
  }

  try {
    const colRef = collection(db, "bookings");
    const snapshot = await getDocs(colRef);

    const batch = writeBatch(db);

    // Delete removed docs
    const currentIds = new Set(bookings.map((b) => b.id));
    snapshot.forEach((d) => {
      if (!currentIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Upsert bookings
    bookings.forEach((b) => {
      const docRef = doc(db, "bookings", b.id);
      batch.set(docRef, stripUndefined(b), { merge: true });
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error("Error batch saving bookings to Firestore:", err);
    return false;
  }
}

function upsertLocalBooking(booking: Booking): boolean {
  const current = getServerBookings();
  const index = current.findIndex((b) => b.id === booking.id);
  const updated =
    index >= 0
      ? current.map((b) => (b.id === booking.id ? booking : b))
      : [booking, ...current];
  return saveServerBookings(updated);
}

// ponytail: without Firebase, disk is the only store. On Vercel that disk
// is read-only + ephemeral, so writeFileSync fails: report that honestly
// instead of pretending the in-memory mutation persisted.
export async function upsertDBBooking(booking: Booking): Promise<boolean> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return upsertLocalBooking(booking);
  }

  try {
    const docRef = doc(db, "bookings", booking.id);
    await setDoc(docRef, stripUndefined(booking), { merge: true });
    // Mirror to disk only after Firestore confirms the write.
    upsertLocalBooking(booking);
    return true;
  } catch (err) {
    console.error("Error upserting booking in Firestore:", err);
    return false;
  }
}

export async function deleteDBBooking(id: string): Promise<boolean> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    const current = getServerBookings();
    return saveServerBookings(current.filter((b) => b.id !== id));
  }

  try {
    const docRef = doc(db, "bookings", id);
    await deleteDoc(docRef);
    // Mirror to disk only after Firestore confirms the delete.
    const current = getServerBookings();
    saveServerBookings(current.filter((b) => b.id !== id));
    return true;
  } catch (err) {
    console.error("Error deleting booking from Firestore:", err);
    return false;
  }
}

// ----------------- SCHEDULE CONFIG -----------------
export async function getDBScheduleConfig(): Promise<ScheduleConfig> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerScheduleConfig();
  }

  try {
    const docRef = doc(db, "config", "schedule");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as ScheduleConfig;
      saveServerScheduleConfig(data);
      return data;
    }
  } catch (err) {
    console.error("Error reading schedule config from Firestore:", err);
  }

  return getServerScheduleConfig();
}

export async function saveDBScheduleConfig(
  config: ScheduleConfig,
): Promise<boolean> {
  const fsOk = saveServerScheduleConfig(config);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "schedule");
    await setDoc(docRef, stripUndefined(config));
    return true;
  } catch (err) {
    console.error("Error saving schedule config to Firestore:", err);
    return false;
  }
}

// ----------------- BANK CONFIG -----------------
export async function getDBBankConfig(): Promise<BankConfig> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerBankConfig();
  }

  try {
    const docRef = doc(db, "config", "bank");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as BankConfig;
      saveServerBankConfig(data);
      return data;
    }
  } catch (err) {
    console.error("Error reading bank config from Firestore:", err);
  }

  return getServerBankConfig();
}

export async function saveDBBankConfig(bank: BankConfig): Promise<boolean> {
  const fsOk = saveServerBankConfig(bank);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "bank");
    await setDoc(docRef, stripUndefined(bank));
    return true;
  } catch (err) {
    console.error("Error saving bank config to Firestore:", err);
    return false;
  }
}

// ----------------- PLAN PRICES -----------------
export async function getDBPlanPrices(): Promise<
  Record<string, string | undefined>
> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerPlanPrices();
  }

  try {
    const docRef = doc(db, "config", "plan_prices");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Record<string, string | undefined>;
      saveServerPlanPrices(data);
      return data;
    }
  } catch (err) {
    console.error("Error reading plan prices from Firestore:", err);
  }

  return getServerPlanPrices();
}

export async function saveDBPlanPrices(
  prices: Record<string, string | undefined>,
): Promise<boolean> {
  const fsOk = saveServerPlanPrices(prices);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "plan_prices");
    await setDoc(docRef, stripUndefined(prices));
    return true;
  } catch (err) {
    console.error("Error saving plan prices to Firestore:", err);
    return false;
  }
}

// ----------------- CLINICAL PROFILES -----------------
export async function getDBClinicalProfiles(): Promise<Record<string, StudentClinicalProfile>> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerClinicalProfiles();
  }

  try {
    const docRef = doc(db, "config", "clinical_profiles");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as Record<string, StudentClinicalProfile>;
      saveServerClinicalProfiles(data);
      return data;
    }
  } catch (err) {
    console.error("Error reading clinical profiles from Firestore:", err);
  }

  return getServerClinicalProfiles();
}

export async function saveDBClinicalProfiles(
  profiles: Record<string, StudentClinicalProfile>,
): Promise<boolean> {
  const fsOk = saveServerClinicalProfiles(profiles);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "clinical_profiles");
    await setDoc(docRef, stripUndefined(profiles));
    return true;
  } catch (err) {
    console.error("Error saving clinical profiles to Firestore:", err);
    return false;
  }
}

// ----------------- GIFT CARDS -----------------
export async function getDBGiftCards(): Promise<GiftCard[]> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerGiftCards();
  }

  try {
    const docRef = doc(db, "config", "gift_cards");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const list = Array.isArray(data?.cards) ? data.cards : [];
      saveServerGiftCards(list);
      return list;
    }
  } catch (err) {
    console.error("Error reading gift cards from Firestore:", err);
  }

  return getServerGiftCards();
}

export async function saveDBGiftCards(cards: GiftCard[]): Promise<boolean> {
  const fsOk = saveServerGiftCards(cards);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "gift_cards");
    await setDoc(docRef, stripUndefined({ cards }));
    return true;
  } catch (err) {
    console.error("Error saving gift cards to Firestore:", err);
    return false;
  }
}

// ----------------- GALLERY IMAGES -----------------
export async function getDBGalleryImages(): Promise<GalleryImageItem[]> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerGalleryImages();
  }

  try {
    const docRef = doc(db, "config", "gallery_images");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const list = Array.isArray(data?.images)
        ? data.images
        : DEFAULT_GALLERY_IMAGES;
      saveServerGalleryImages(list);
      return list;
    }
  } catch (err) {
    console.error("Error reading gallery images from Firestore:", err);
  }

  return getServerGalleryImages();
}

export async function saveDBGalleryImages(
  images: GalleryImageItem[],
): Promise<boolean> {
  const fsOk = saveServerGalleryImages(images);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "gallery_images");
    await setDoc(docRef, stripUndefined({ images }));
    return true;
  } catch (err) {
    console.error("Error saving gallery images to Firestore:", err);
    return false;
  }
}

// ----------------- MESSAGE TEMPLATES -----------------
export async function getDBMessageTemplates(): Promise<MessageTemplatesConfig> {
  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) {
    return getServerMessageTemplates();
  }

  try {
    const docRef = doc(db, "config", "message_templates");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as MessageTemplatesConfig;
      const merged = { ...DEFAULT_MESSAGE_TEMPLATES, ...data };
      saveServerMessageTemplates(merged);
      return merged;
    }
  } catch (err) {
    console.error("Error reading message templates from Firestore:", err);
  }

  return getServerMessageTemplates();
}

export async function saveDBMessageTemplates(
  templates: MessageTemplatesConfig,
): Promise<boolean> {
  const merged = { ...DEFAULT_MESSAGE_TEMPLATES, ...templates };
  const fsOk = saveServerMessageTemplates(merged);

  const db = getFirestoreDB();
  if (!db || !isFirebaseConfigured()) return fsOk;

  try {
    const docRef = doc(db, "config", "message_templates");
    await setDoc(docRef, stripUndefined(merged));
    return true;
  } catch (err) {
    console.error("Error saving message templates to Firestore:", err);
    return false;
  }
}
