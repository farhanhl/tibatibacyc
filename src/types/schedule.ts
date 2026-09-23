export interface RideSchedule {
  id?: string;
  title: string;
  destination: string;
  date: string; // Format YYYY-MM-DD (e.g. 2026-09-27)
  time: string; // e.g. "05:30 WIB"
  meetingPoint: string; // e.g. "Alfamidi depan Tol Bekasi Timur"
  distance: string; // e.g. "27 KM"
  bikePolicy?: string; // e.g. "Semua jenis sepeda boleh ikut"
  notes?: string; // e.g. "Gowes santai, jangan lupa helm & uang kopi!"
  joinUrl?: string; // link WhatsApp group
  isActive: boolean;
  createdAt?: string | number;
}
