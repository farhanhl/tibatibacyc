import { EventItem } from "@/types/profile";

/**
 * Helper untuk parse jam & menit dari string waktu
 * Contoh: "19:30 WIB" -> { hours: 19, minutes: 30 }
 * Contoh: "05:30 WIB" -> { hours: 5, minutes: 30 }
 */
function parseEventTime(timeStr?: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 5, minutes: 30 };

  const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return {
      hours: parseInt(match[1], 10),
      minutes: parseInt(match[2], 10),
    };
  }

  const hourOnly = timeStr.match(/(\d{1,2})/);
  if (hourOnly) {
    return {
      hours: parseInt(hourOnly[1], 10),
      minutes: 0,
    };
  }

  return { hours: 5, minutes: 30 };
}

/**
 * Format Date ke string iCalendar UTC (YYYYMMDDTHHMMSSZ)
 */
function formatUtcIcsDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Menghasilkan link Google Calendar Web Intent
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  const { hours, minutes } = parseEventTime(event.time);

  // Waktu Mulai (WIB = UTC+7)
  const [year, month, day] = event.date.split("-").map((v) => parseInt(v, 10));
  // Buat Date objek berbasis WIB
  const startDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0));
  // Estimasi durasi 3 jam
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const startUtc = formatUtcIcsDate(startDate);
  const endUtc = formatUtcIcsDate(endDate);

  const title = encodeURIComponent(`🚴‍♂️ Tiba-Tiba Cycling: ${event.name}`);
  const location = encodeURIComponent(`${event.startLocation}, Bekasi`);

  const detailsText = [
    `Kegiatan: ${event.name}`,
    `Titik Start: ${event.startLocation}`,
    `Jam Kumpul: ${event.time || "05:30 WIB"}`,
    event.distance ? `Jarak Tempuh: ${event.distance}` : "",
    event.bikePolicy ? `Ketentuan Sepeda: ${event.bikePolicy}` : "",
    event.notes ? `Catatan: ${event.notes}` : "",
    "",
    "Info & Website: https://tibatibacyc.my.id",
    event.joinUrl ? `Grup WhatsApp: ${event.joinUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const details = encodeURIComponent(detailsText);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}&ctz=Asia/Jakarta`;
}

/**
 * Deteksi tipe perangkat pengguna berdasarkan User Agent
 */
export function detectDeviceType(): "ios" | "android" | "desktop" {
  if (typeof window === "undefined" || !navigator) return "desktop";

  const ua = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || "";

  // Deteksi iOS (iPhone, iPad, iPod, dan iPadOS baru yang berkedok Macintosh dengan multitouch)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) return "ios";

  // Deteksi Android
  const isAndroid = /android/i.test(ua);
  if (isAndroid) return "android";

  return "desktop";
}

/**
 * Menghasilkan dan mendownload file iCalendar (.ics) untuk Apple Calendar / Outlook / iPhone
 */
export function downloadIcsCalendar(event: EventItem): void {
  const { hours, minutes } = parseEventTime(event.time);

  const [year, month, day] = event.date.split("-").map((v) => parseInt(v, 10));
  // Buat Date objek UTC (WIB = UTC-7)
  const startDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0));
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  const now = new Date();

  const dtStamp = formatUtcIcsDate(now);
  const dtStart = formatUtcIcsDate(startDate);
  const dtEnd = formatUtcIcsDate(endDate);

  const description = [
    `Gowes bareng Tiba-Tiba Cycling Bekasi.`,
    `Kegiatan: ${event.name}`,
    `Titik Kumpul: ${event.startLocation}`,
    `Waktu: ${event.time || "05:30 WIB"}`,
    event.distance ? `Jarak: ${event.distance}` : "",
    event.bikePolicy ? `Ketentuan: ${event.bikePolicy}` : "",
    event.notes ? `Tips: ${event.notes}` : "",
    `Website: https://tibatibacyc.my.id`,
  ]
    .filter(Boolean)
    .join("\\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tiba-Tiba Cycling Bekasi//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:tibatiba-${event.slug || event.id || Date.now()}@tibatibacyc.my.id`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:🚴‍♂️ Tiba-Tiba Cycling: ${event.name}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.startLocation}, Bekasi`,
    "STATUS:CONFIRMED",
    // Alarm pengingat 2 jam sebelum kegiatan
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Pengingat Gowes: ${event.name} dimulai 2 jam lagi!`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `tibatiba-${event.slug || "jadwal-gowes"}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Otomatis pasang pengingat ke kalender sesuai User-Agent device pengguna
 */
export function addEventToDeviceCalendar(event: EventItem): {
  device: "ios" | "android" | "desktop";
  message: string;
} {
  const device = detectDeviceType();

  if (device === "ios") {
    downloadIcsCalendar(event);
    return {
      device: "ios",
      message: "Membuka Apple Calendar / Menyimpan jadwal di iPhone...",
    };
  } else if (device === "android") {
    const url = getGoogleCalendarUrl(event);
    window.open(url, "_blank");
    return {
      device: "android",
      message: "Membuka aplikasi Google Calendar di Android...",
    };
  } else {
    // Desktop: buka Google Calendar Web
    const url = getGoogleCalendarUrl(event);
    window.open(url, "_blank");
    return {
      device: "desktop",
      message: "Membuka Google Calendar...",
    };
  }
}

