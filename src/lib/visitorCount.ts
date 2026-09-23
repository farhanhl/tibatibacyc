import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";

/**
 * Helper generic untuk increment hitungan harian ('visitor_counters' | 'join_counters')
 * Menggunakan atomic increment di Firebase agar 100% permanen dan kompatibel dengan Vercel Serverless.
 */
async function incrementCounter(
  collectionName: string,
  dateKey: string
): Promise<number> {
  try {
    const docRef = doc(db, collectionName, dateKey);
    // Tambahkan +1 secara atomik di database online
    await setDoc(
      docRef,
      {
        count: increment(1),
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    // Ambil nilai terbaru
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().count || 1;
    }
    return 1;
  } catch (err) {
    console.warn(`[Counter] Gagal update ke database online (${collectionName}):`, err);
    return 1;
  }
}

/**
 * Menambahkan +1 hitungan pengunjung untuk tanggal tertentu (format key: YYYY-MM-DD)
 */
export async function incrementDailyVisitor(dateKey: string): Promise<number> {
  return incrementCounter("visitor_counters", dateKey);
}

/**
 * Menambahkan +1 hitungan yang mau join WhatsApp untuk tanggal tertentu (format key: YYYY-MM-DD)
 */
export async function incrementDailyJoin(dateKey: string): Promise<number> {
  return incrementCounter("join_counters", dateKey);
}

/**
 * Mengambil informasi tanggal Indonesia (misal: "23 September 2026")
 * dan key tanggal (misal: "2026-09-23") sesuai zona waktu WIB (Asia/Jakarta).
 */
export function getJakartaDateInfo() {
  const now = new Date();

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(now);

  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return { formattedDate, dateKey };
}
