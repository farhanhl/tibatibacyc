export type MerchandiseSize =
  | "S"
  | "M"
  | "L"
  | "XL"
  | "2XL"
  | "3XL"
  | "4XL"
  | "5XL"
  | "XXL";

export interface MerchandiseOrder {
  id?: string;
  nama: string;
  whatsapp: string;
  furing: "pakai" | "tanpa";
  desainBelakang: "sablon" | "bordir";
  ukuran: MerchandiseSize;
  qty: number;
  hargaSatuan: number;
  totalHarga: number;
  catatan?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface SizeChartItem {
  size: string;
  lebar: number; // in cm (Lebar Dada)
  lebarDada: number; // in cm
  panjang: number; // in cm
  lingkarDada: number; // in cm
}
