import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin, verifySuperAdminPin } from "@/lib/adminAuth";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { AdminPinRecord, AdminTabId } from "@/types/admin";

export const dynamic = "force-dynamic";

const COLLECTION_NAME = "admin_pins";
const DB_TIMEOUT_MS = 8000;

/**
 * Helper untuk mencegah request Firebase menggantung tanpa batas waktu.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DB_TIMEOUT_MS,
  errorMsg: string = "Operasi database timeout."
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(errorMsg));
      }, timeoutMs);
      // Hindari process timer hanging
      if (typeof timer.unref === "function") {
        timer.unref();
      }
    }),
  ]);
}

/**
 * GET /api/admin/pins
 * Mengambil seluruh daftar PIN Admin kustom (Hanya Super Admin)
 */
export async function GET() {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Fitur ini hanya untuk Super Admin." },
      { status: 403 }
    );
  }

  try {
    const snap = await withTimeout(
      getDocs(collection(db, COLLECTION_NAME)),
      DB_TIMEOUT_MS,
      "Waktu koneksi database Firestore habis saat mengambil daftar PIN."
    );
    const items: AdminPinRecord[] = [];

    snap.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        label: data.label || "",
        pin: data.pin || "",
        allowedTabs: Array.isArray(data.allowedTabs) ? data.allowedTabs : [],
        isActive: data.isActive !== false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt,
      });
    });

    // Urutkan berdasarkan waktu pembuatan terbaru
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({
      success: true,
      pins: items,
    });
  } catch (error: any) {
    console.error("Gagal mengambil daftar PIN:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pins
 * Membuat PIN Admin kustom baru (Hanya Super Admin)
 */
export async function POST(req: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Fitur ini hanya untuk Super Admin." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const label = (body.label || "").trim();
    const pin = (body.pin || "").trim();
    const allowedTabs: AdminTabId[] = Array.isArray(body.allowedTabs) ? body.allowedTabs : [];
    const isActive = body.isActive !== false;

    if (!label) {
      return NextResponse.json(
        { success: false, error: "Nama / Label Petugas Admin wajib diisi." },
        { status: 400 }
      );
    }

    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { success: false, error: "PIN minimal harus terdiri dari 4 karakter/digit." },
        { status: 400 }
      );
    }

    if (allowedTabs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pilih minimal 1 modul fitur yang boleh diakses." },
        { status: 400 }
      );
    }

    // Larang menggunakan PIN yang sama dengan Master PIN Super Admin
    if (verifySuperAdminPin(pin)) {
      return NextResponse.json(
        { success: false, error: "PIN ini sama dengan Master PIN Super Admin. Harap gunakan PIN berbeda." },
        { status: 400 }
      );
    }

    // Periksa apakah PIN sudah dipakai oleh akun admin kustom lain yang aktif
    const duplicateQuery = query(
      collection(db, COLLECTION_NAME),
      where("pin", "==", pin),
      limit(1)
    );
    const dupSnap = await withTimeout(
      getDocs(duplicateQuery),
      6000,
      "Waktu habis saat memeriksa ketersediaan PIN di database."
    );
    if (!dupSnap.empty) {
      return NextResponse.json(
        { success: false, error: "PIN ini sudah digunakan oleh admin lain. Silakan buat PIN yang berbeda." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const docRef = await withTimeout(
      addDoc(collection(db, COLLECTION_NAME), {
        label,
        pin,
        allowedTabs,
        isActive,
        createdAt: now,
        updatedAt: now,
      }),
      DB_TIMEOUT_MS,
      "Waktu habis saat menyimpan data PIN ke database Firestore."
    );

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: `PIN untuk "${label}" berhasil dibuat.`,
    });
  } catch (error: any) {
    console.error("Gagal membuat PIN baru:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pins
 * Memperbarui PIN Admin kustom (Hanya Super Admin)
 */
export async function PUT(req: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Fitur ini hanya untuk Super Admin." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id;
    const label = (body.label || "").trim();
    const pin = (body.pin || "").trim();
    const allowedTabs: AdminTabId[] = Array.isArray(body.allowedTabs) ? body.allowedTabs : [];
    const isActive = body.isActive !== false;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID PIN tidak valid." },
        { status: 400 }
      );
    }

    if (!label || !pin || pin.length < 4 || allowedTabs.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap. Pastikan Label, PIN (min 4 digit), dan Modul sudah diisi." },
        { status: 400 }
      );
    }

    if (verifySuperAdminPin(pin)) {
      return NextResponse.json(
        { success: false, error: "PIN ini sama dengan Master PIN Super Admin. Harap gunakan PIN berbeda." },
        { status: 400 }
      );
    }

    const targetDoc = doc(db, COLLECTION_NAME, id);
    const currentSnap = await withTimeout(
      getDoc(targetDoc),
      6000,
      "Waktu habis saat membaca data PIN dari database."
    );

    if (!currentSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Data PIN tidak ditemukan atau telah dihapus." },
        { status: 404 }
      );
    }

    const currentData = currentSnap.data();

    // Optimasi performa: Cek duplikasi HANYA jika PIN berubah
    if (currentData.pin !== pin) {
      const duplicateQuery = query(
        collection(db, COLLECTION_NAME),
        where("pin", "==", pin),
        limit(1)
      );
      const dupSnap = await withTimeout(
        getDocs(duplicateQuery),
        6000,
        "Waktu habis saat memeriksa duplikasi PIN."
      );
      if (!dupSnap.empty) {
        return NextResponse.json(
          { success: false, error: "PIN ini sudah digunakan oleh admin lain. Silakan buat PIN yang berbeda." },
          { status: 400 }
        );
      }
    }

    await withTimeout(
      updateDoc(targetDoc, {
        label,
        pin,
        allowedTabs,
        isActive,
        updatedAt: new Date().toISOString(),
      }),
      DB_TIMEOUT_MS,
      "Waktu habis saat memperbarui data PIN di database Firestore."
    );

    return NextResponse.json({
      success: true,
      message: `PIN "${label}" berhasil diperbarui.`,
    });
  } catch (error: any) {
    console.error("Gagal memperbarui PIN:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pins
 * Menghapus PIN Admin kustom (Hanya Super Admin)
 */
export async function DELETE(req: NextRequest) {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak. Fitur ini hanya untuk Super Admin." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter ID PIN wajib disertakan." },
        { status: 400 }
      );
    }

    const targetDoc = doc(db, COLLECTION_NAME, id);
    await withTimeout(
      deleteDoc(targetDoc),
      DB_TIMEOUT_MS,
      "Waktu habis saat menghapus data PIN dari Firestore."
    );

    return NextResponse.json({
      success: true,
      message: "PIN admin berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("Gagal menghapus PIN:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
