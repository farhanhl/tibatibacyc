import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";
import {
  isGoogleDriveConfigured,
  listDriveKegiatanFolders,
  getOrCreateKegiatanFolder,
} from "@/lib/googleDriveService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/drive/events
 * Mengambil daftar folder kegiatan dari folder induk Google Drive
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
        error:
          "Google Drive belum dikonfigurasi. Harap atur GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, dan GOOGLE_REFRESH_TOKEN di environment variables.",
      },
      { status: 400 }
    );
  }

  try {
    const folders = await listDriveKegiatanFolders();
    return NextResponse.json({
      success: true,
      isConfigured: true,
      events: folders,
    });
  } catch (error: unknown) {
    console.error("Gagal mengambil folder kegiatan Google Drive:", error);
    const message = error instanceof Error ? error.message : "Gagal mengambil folder kegiatan dari Google Drive.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/drive/events
 * Membuat folder kegiatan baru di Google Drive (atau memakai ulang jika sudah ada)
 * Body: { date: "YYYY-MM-DD", name: "Gowes Pagi Cikarang" }
 */
export async function POST(req: NextRequest) {
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
    const body = await req.json().catch(() => ({}));
    const { date, name } = body;

    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal tidak valid. Gunakan format YYYY-MM-DD (contoh: 2026-11-08).",
        },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Nama kegiatan tidak boleh kosong.",
        },
        { status: 400 }
      );
    }

    const folder = await getOrCreateKegiatanFolder(date, name);

    return NextResponse.json({
      success: true,
      folder,
    });
  } catch (error: unknown) {
    console.error("Gagal membuat/mencari folder kegiatan:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat folder kegiatan di Google Drive.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
