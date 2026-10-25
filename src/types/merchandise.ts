export interface MerchandiseOrder {
  id?: string;
  nama: string;
  whatsapp: string;
  furing: "pakai" | "tanpa";
  desainBelakang: "sablon" | "bordir";
  ukuran: "S" | "M" | "L" | "XL" | "XXL" | "3XL";
  qty: number;
  hargaSatuan: number;
  totalHarga: number;
  catatan?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface SizeChartItem {
  size: string;
  panjang: number; // in cm
  lebarDada: number; // in cm
  lingkarDada: number; // in cm
}
