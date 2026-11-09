export type AdminTabId =
  | "overview"
  | "events"
  | "media"
  | "merchandise"
  | "settings"
  | "pins";

export interface AdminModuleConfig {
  id: AdminTabId;
  label: string;
  icon: string;
  description: string;
  tag: string;
}

export const ADMIN_MODULES: AdminModuleConfig[] = [
  {
    id: "events",
    label: "Kelola Kegiatan & Jadwal Gowes",
    icon: "🚴",
    tag: "Kegiatan",
    description: "Tambah, edit, dan hapus jadwal kegiatan gowes, rute peta, dan poster kegiatan",
  },
  {
    id: "media",
    label: "Upload Media Dokumentasi",
    icon: "📸",
    tag: "Dokumentasi",
    description: "Upload foto & video dokumentasi resolusi tinggi langsung ke Google Drive",
  },
  {
    id: "merchandise",
    label: "Pre-Order Merchandise",
    icon: "👕",
    tag: "Merchandise",
    description: "Lihat data pemesan rompi official, update status konfirmasi bayar & kirim",
  },
  {
    id: "overview",
    label: "Ringkasan Trafik & Analitik",
    icon: "📊",
    tag: "Analitik",
    description: "Pantau pengunjung web, klik tombol join WhatsApp, dan rasio konversi harian",
  },
  {
    id: "settings",
    label: "Sistem & Info Koneksi",
    icon: "⚙️",
    tag: "Sistem",
    description: "Status layanan pihak ketiga: Google Drive OAuth, Firebase, Cloudinary, Telegram",
  },
];

export interface AdminPinRecord {
  id: string;
  label: string;
  pin: string;
  allowedTabs: AdminTabId[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminSessionInfo {
  authenticated: boolean;
  role?: "super_admin" | "custom_admin";
  label?: string;
  allowedTabs?: AdminTabId[];
}

