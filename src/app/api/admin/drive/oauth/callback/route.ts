import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleDriveService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/drive/oauth/callback
 * Menerima callback dari Google OAuth setelah pemilik akun memberikan izin
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; background: #111; color: #fff; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Otorisasi Dibatalkan atau Gagal</h2>
          <p>${error}</p>
          <a href="/admin" style="color: #38bdf8;">Kembali ke Admin Dashboard</a>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  if (!code) {
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; background: #111; color: #fff; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Parameter code tidak ditemukan</h2>
          <a href="/admin" style="color: #38bdf8;">Kembali ke Admin Dashboard</a>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  try {
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/admin/drive/oauth/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    const refreshToken = tokens.refresh_token;

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Google Drive Berhasil Terhubung - TibatibaCYC</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            background-color: #0c0d0e;
            color: #eae6dd;
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            max-width: 640px;
            width: 100%;
            padding: 32px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          h2 { color: #10b981; margin-top: 0; }
          code, pre {
            background: #18191c;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 12px;
            font-family: monospace;
            word-break: break-all;
            white-space: pre-wrap;
            color: #fbbf24;
            display: block;
            margin: 12px 0;
            user-select: all;
          }
          .btn {
            display: inline-block;
            background: #c44341;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 16px;
          }
          .btn:hover { background: #a93434; }
          .step { margin-top: 16px; font-size: 14px; line-height: 1.6; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ Google Drive Berhasil Dihubungkan!</h2>
          <p>Otorisasi OAuth 2.0 atas nama akun Google Anda telah berhasil disetujui.</p>

          ${
            refreshToken
              ? `<div>
                  <p class="step"><strong>Salin Refresh Token berikut ke Environment Variables (Vercel & .env.local):</strong></p>
                  <pre>GOOGLE_REFRESH_TOKEN=${refreshToken}</pre>
                  <p class="step">Setelah disimpan di Vercel atau .env.local, restart server/redeploy agar token aktif secara permanen.</p>
                </div>`
              : `<p class="step" style="color: #60a5fa;">Akun Google sudah terhubung sebelumnya. Jika Anda membutuhkan refresh token baru, batalkan izin TibatibaCYC di <a href="https://myaccount.google.com/permissions" target="_blank" style="color: #38bdf8;">Google Account Permissions</a> lalu hubungkan ulang.</p>`
          }

          <div style="margin-top: 24px;">
            <a href="/admin" class="btn">Kembali ke Dashboard Admin</a>
          </div>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; background: #111; color: #fff; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Gagal Menukar Token Google</h2>
          <p>${message}</p>
          <a href="/admin" style="color: #38bdf8;">Kembali ke Admin Dashboard</a>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}
