import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { RideSchedule } from "@/types/schedule";

/**
 * Menghitung selisih hari dari hari ini di zona waktu Asia/Jakarta (WIB).
 * Nilai >= 0 berarti hari ini atau masa depan, < 0 berarti masa lalu.
 */
export function getDaysDifference(targetDateStr: string): number {
  try {
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = jakartaFormatter.format(now);

    const todayDate = new Date(todayStr + "T00:00:00+07:00");
    const targetDate = new Date(targetDateStr + "T00:00:00+07:00");

    const diffTime = targetDate.getTime() - todayDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return -999;
  }
}

/**
 * Menentukan label waktu (PAGI, SIANG, SORE, MALAM) dari string jam kumpul
 * Contoh: "19:30 WIB" -> "MALAM", "05:30 WIB" -> "PAGI", "13:00 WIB" -> "SIANG"
 */
export function getTimeOfDayLabel(timeStr?: string): "PAGI" | "SIANG" | "SORE" | "MALAM" {
  if (!timeStr) return "PAGI";
  const lower = timeStr.toLowerCase();
  if (lower.includes("pagi") || lower.includes("subuh")) return "PAGI";
  if (lower.includes("siang")) return "SIANG";
  if (lower.includes("sore")) return "SORE";
  if (lower.includes("malam")) return "MALAM";

  const match = timeStr.match(/(\d{1,2})[:.](\d{2})/) || timeStr.match(/(\d{1,2})/);
  if (match) {
    const hour = parseInt(match[1], 10);
    if (hour >= 4 && hour < 11) return "PAGI";
    if (hour >= 11 && hour < 15) return "SIANG";
    if (hour >= 15 && hour < 18) return "SORE";
    if (hour >= 18 || hour < 4) return "MALAM";
  }
  return "PAGI";
}

/**
 * Menghitung selisih hari (H-?) dari tanggal gowes (format YYYY-MM-DD)
 * berdasarkan zona waktu Asia/Jakarta (WIB) dan jam kumpul.
 */
export function calculateDaysRemaining(targetDateStr: string, timeStr?: string): {
  days: number;
  label: string;
  badgeColor: string;
  isPast: boolean;
  isToday: boolean;
} {
  try {
    const diffDays = getDaysDifference(targetDateStr);

    if (diffDays < 0) {
      return {
        days: diffDays,
        label: "SELESAI",
        badgeColor: "bg-gray-600",
        isPast: true,
        isToday: false,
      };
    } else if (diffDays === 0) {
      return {
        days: 0,
        label: "🔥 HARI INI!",
        badgeColor: "bg-emerald-600 animate-pulse",
        isToday: true,
        isPast: false,
      };
    } else if (diffDays === 1) {
      const timeLabel = getTimeOfDayLabel(timeStr);
      return {
        days: 1,
        label: `⚡ BESOK ${timeLabel}! (H-1)`,
        badgeColor: "bg-[#C44341] animate-pulse",
        isToday: false,
        isPast: false,
      };
    } else {
      return {
        days: diffDays,
        label: `⏳ H-${diffDays} MENUJU GOWES`,
        badgeColor: "bg-[#C44341]",
        isToday: false,
        isPast: false,
      };
    }
  } catch {
    return {
      days: 0,
      label: "JADWAL GOWES",
      badgeColor: "bg-[#C44341]",
      isPast: false,
      isToday: false,
    };
  }
}

/**
 * Format tanggal YYYY-MM-DD ke Bahasa Indonesia lengkap
 * Contoh: "2026-09-27" -> "Minggu, 27 September 2026"
 */
export function formatIndonesianFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00+07:00");
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Mengambil jadwal gowes aktif terdekat dari Firestore
 */
export async function getActiveRideSchedule(): Promise<RideSchedule | null> {
  try {
    const schedulesRef = collection(db, "schedules");
    // Ambil jadwal yang aktif
    const q = query(
      schedulesRef,
      where("isActive", "==", true),
      limit(5)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const schedules: RideSchedule[] = [];
    snapshot.forEach((doc) => {
      schedules.push({ id: doc.id, ...(doc.data() as Omit<RideSchedule, "id">) });
    });

    // Urutkan berdasarkan tanggal terdekat yang belum lewat
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const upcoming = schedules
      .filter((s) => s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    return upcoming.length > 0 ? upcoming[0] : schedules[0];
  } catch (error) {
    console.warn("[Firebase Firestore] Error fetching active schedule:", error);
    return null;
  }
}
