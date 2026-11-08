import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";
import {
  isGoogleDriveConfigured,
  getDriveStorageInfo,
} from "@/lib/googleDriveService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/drive/storage
 * Mengambil kuota penyimpanan Google Drive (total, terpakai, sisa)
 */
export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak: Anda belum login sebagai admin." },
      { status: 401 }
    );
  }

  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      {
        success: false,
        isConfigured: false,
        error: "Google Drive belum dikonfigurasi.",
      },
      { status: 400 }
    );
  }

  try {
    const storage = await getDriveStorageInfo();
    return NextResponse.json({
      success: true,
      isConfigured: true,
      storage,
    });
  } catch (error: unknown) {
    console.error("Gagal memeriksa penyimpanan Google Drive:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil data kuota Google Drive.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
