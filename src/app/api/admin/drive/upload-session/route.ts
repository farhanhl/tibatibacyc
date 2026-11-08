import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";
import {
  isGoogleDriveConfigured,
  createResumableUploadSession,
} from "@/lib/googleDriveService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/drive/upload-session
 * Membuat Sesi Resumable Upload langsung ke Google Drive
 * Body: { eventFolderId, kind, fileName, mimeType, size }
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
      { success: false, error: "Google Drive belum dikonfigurasi." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { eventFolderId, kind, fileName, mimeType, size } = body;

    if (!eventFolderId || typeof eventFolderId !== "string") {
      return NextResponse.json(
        { success: false, error: "eventFolderId wajib disertakan." },
        { status: 400 }
      );
    }

    if (kind !== "foto" && kind !== "video") {
      return NextResponse.json(
        { success: false, error: "kind harus bernilai 'foto' atau 'video'." },
        { status: 400 }
      );
    }

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { success: false, error: "fileName wajib disertakan." },
        { status: 400 }
      );
    }

    if (typeof size !== "number" || size <= 0) {
      return NextResponse.json(
        { success: false, error: "Ukuran file (size) tidak valid." },
        { status: 400 }
      );
    }

    // Validasi batas ukuran foto jika ada (default 50MB)
    const maxPhotoMb = parseInt(process.env.MAX_PHOTO_SIZE_MB || "50", 10);
    if (kind === "foto" && size > maxPhotoMb * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: `Ukuran foto melebihi batas ${maxPhotoMb} MB sebelum upload.`,
        },
        { status: 400 }
      );
    }

    // Ambil origin browser agar Google Drive mengizinkan CORS langsung dari browser
    const origin = req.headers.get("origin") || req.headers.get("referer");

    const session = await createResumableUploadSession({
      eventFolderId,
      kind,
      fileName,
      mimeType: mimeType || "application/octet-stream",
      size,
      origin,
    });

    return NextResponse.json({
      success: true,
      ...session,
    });
  } catch (error: unknown) {
    console.error("Gagal membuat sesi upload Google Drive:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat sesi upload ke Google Drive.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
