import fs from "fs";
import path from "path";

// Memory cache fallback jika di serverless / read-only filesystem
const memoryVisitorCounts: Record<string, number> = {};
const memoryJoinCounts: Record<string, number> = {};

/**
 * Helper generic untuk increment hitungan harian berdasarkan tipe ('visitor' | 'join')
 */
async function incrementCounter(
  filename: string,
  memoryCache: Record<string, number>,
  dateKey: string
): Promise<number> {
  const dataDir = path.join(process.cwd(), "data");
  const filePath = path.join(dataDir, filename);

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let fileData: Record<string, number> = {};
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        fileData = JSON.parse(raw);
      } catch {
        fileData = {};
      }
    }

    const currentCount = (fileData[dateKey] || memoryCache[dateKey] || 0) + 1;
    fileData[dateKey] = currentCount;
    memoryCache[dateKey] = currentCount;

    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");
    return currentCount;
  } catch (err) {
    // Fallback in-memory jika file system tidak bisa ditulis (misal Vercel serverless)
    const fallbackCount = (memoryCache[dateKey] || 0) + 1;
    memoryCache[dateKey] = fallbackCount;
    return fallbackCount;
  }
}

/**
 * Menambahkan +1 hitungan pengunjung untuk tanggal tertentu (format key: YYYY-MM-DD)
 */
export async function incrementDailyVisitor(dateKey: string): Promise<number> {
  return incrementCounter("visitor-counts.json", memoryVisitorCounts, dateKey);
}

/**
 * Menambahkan +1 hitungan yang mau join WhatsApp untuk tanggal tertentu (format key: YYYY-MM-DD)
 */
export async function incrementDailyJoin(dateKey: string): Promise<number> {
  return incrementCounter("join-counts.json", memoryJoinCounts, dateKey);
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
