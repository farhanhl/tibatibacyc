import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
} from "firebase/firestore";
import { EventItem } from "@/types/profile";

const EVENTS_COLLECTION = "events";

/**
 * Mengambil daftar seluruh event/kegiatan murni dari database Firestore.
 */
export async function getEventsFromDb(): Promise<EventItem[]> {
  try {
    const q = query(collection(db, EVENTS_COLLECTION));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const items: EventItem[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as Omit<EventItem, "id">;
      items.push({
        id: d.id,
        ...data,
      });
    });

    // Urutkan berdasarkan tanggal terbaru jika ada
    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return items;
  } catch (error) {
    console.error("Gagal mengambil event dari Firestore:", error);
    return [];
  }
}

/**
 * Menyimpan kegiatan baru ke Firestore
 */
export async function createEventInDb(eventData: Omit<EventItem, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...eventData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Memperbarui kegiatan di Firestore
 */
export async function updateEventInDb(id: string, eventData: Partial<EventItem>): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...eventData,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Menghapus kegiatan dari Firestore
 */
export async function deleteEventFromDb(id: string): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, id);
  await deleteDoc(docRef);
}
