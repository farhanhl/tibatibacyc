import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { MerchandiseOrder } from "@/types/merchandise";

const MERCHANDISE_ORDERS_COLLECTION = "merchandise_orders";

/**
 * Menyimpan data pesanan merchandise ke Firestore
 */
export async function saveMerchandiseOrder(
  order: Omit<MerchandiseOrder, "id" | "createdAt" | "status">
): Promise<string> {
  try {
    const ordersRef = collection(db, MERCHANDISE_ORDERS_COLLECTION);
    const docRef = await addDoc(ordersRef, {
      ...order,
      status: "pending",
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Gagal menyimpan order merchandise ke Firestore:", error);
    // Tetap kembalikan fallback ID unik jika Firestore offline
    return `ORDER-${Date.now().toString().slice(-6)}`;
  }
}

/**
 * Mengambil seluruh data pesanan merchandise untuk admin
 */
export async function getMerchandiseOrders(): Promise<MerchandiseOrder[]> {
  try {
    const ordersRef = collection(db, MERCHANDISE_ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const orders: MerchandiseOrder[] = [];
    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...(doc.data() as Omit<MerchandiseOrder, "id">) });
    });
    return orders;
  } catch (error) {
    console.warn("Gagal mengambil data pesanan:", error);
    return [];
  }
}

/**
 * Berlangganan real-time listener untuk pesanan merchandise
 */
export function subscribeMerchandiseOrders(
  onUpdate: (orders: MerchandiseOrder[]) => void
): () => void {
  try {
    const ordersRef = collection(db, MERCHANDISE_ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: MerchandiseOrder[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<MerchandiseOrder, "id">) });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn("Error listening to merchandise orders:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Firestore subscription error:", err);
    return () => {};
  }
}

/**
 * Memperbarui status pesanan merchandise
 */
export async function updateMerchandiseOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled"
): Promise<void> {
  const docRef = doc(db, MERCHANDISE_ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Menghapus pesanan merchandise
 */
export async function deleteMerchandiseOrder(orderId: string): Promise<void> {
  const docRef = doc(db, MERCHANDISE_ORDERS_COLLECTION, orderId);
  await deleteDoc(docRef);
}

/**
 * Format teks konfirmasi pemesanan untuk dikirim melalui WhatsApp
 */
export function formatWhatsAppOrderMessage(order: {
  nama: string;
  whatsapp: string;
  furing: "pakai" | "tanpa";
  desainBelakang: "sablon" | "bordir";
  ukuran: string;
  qty: number;
  hargaSatuan: number;
  totalHarga: number;
  catatan?: string;
  orderId?: string;
}): string {
  const furingLabel = order.furing === "pakai" ? "Ya (Pakai Furing)" : "Tidak (Tanpa Furing)";
  const desainLabel = order.desainBelakang === "bordir" ? "Bordir Komputer (+Rp 20.000)" : "Sablon (Standar)";
  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(order.totalHarga);

  const formattedSatuan = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(order.hargaSatuan);

  let message = `*HALO ADMIN TIBA-TIBA CYCLING*\n`;
  message += `Saya ingin konfirmasi pemesanan *Tactical Riding Vest Tiba-Tiba Cycling*:\n\n`;
  if (order.orderId) {
    message += `🏷️ *No. Pesanan:* #${order.orderId}\n`;
  }
  message += `👤 *Nama Pemesan:* ${order.nama}\n`;
  message += `📱 *No. WhatsApp:* ${order.whatsapp}\n`;
  message += `📏 *Ukuran (Size):* ${order.ukuran}\n`;
  message += `🛡️ *Furing:* ${furingLabel}\n`;
  message += `✨ *Desain Belakang:* ${desainLabel}\n`;
  message += `📦 *Jumlah:* ${order.qty} pcs (${formattedSatuan} / pcs)\n`;
  message += `💰 *Estimasi Total:* *${formattedTotal}*\n`;

  if (order.catatan && order.catatan.trim()) {
    message += `📝 *Catatan Tambahan:* ${order.catatan.trim()}\n`;
  }

  message += `\nMohon info rekening pembayaran / DP dan konfirmasi pesanannya ya min. Terima kasih! 🚴💨`;

  return message;
}
