import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";
import {
  isGoogleDriveConfigured,
  getOAuthAuthUrl,
} from "@/lib/googleDriveService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/drive/oauth/url
 * Menghasilkan URL otorisasi Google OAuth 2.0 untuk admin/pemilik akun
 */
export async function GET(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak: Anda belum login sebagai admin." },
      { status: 401 }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        success: false,
        error:
          "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET harus diisi di environment variables terlebih dahulu.",
      },
      { status: 400 }
    );
  }

  try {
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const redirectUri = `${origin}/api/admin/drive/oauth/callback`;
    const authUrl = getOAuthAuthUrl(redirectUri);

    return NextResponse.json({
      success: true,
      authUrl,
      isConfigured: isGoogleDriveConfigured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat URL otorisasi.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
