import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/drive/upload-chunk
 * Fallback proxy untuk upload potongan chunk jika browser mengalami CORS saat upload langsung ke Drive
 */
export async function PUT(req: NextRequest) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: "Akses ditolak: Anda belum login sebagai admin." },
      { status: 401 }
    );
  }

  const uploadUrl = req.headers.get("x-upload-url");
  if (!uploadUrl || !uploadUrl.startsWith("https://www.googleapis.com/")) {
    return NextResponse.json(
      { success: false, error: "Header 'x-upload-url' tidak valid atau bukan Google APIs." },
      { status: 400 }
    );
  }

  const contentRange = req.headers.get("content-range") || "";
  const contentType = req.headers.get("content-type") || "application/octet-stream";

  try {
    // Ambil binary chunk body
    const chunkBuffer = await req.arrayBuffer();

    const forwardHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": chunkBuffer.byteLength.toString(),
    };

    if (contentRange) {
      forwardHeaders["Content-Range"] = contentRange;
    }

    const driveRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: forwardHeaders,
      body: chunkBuffer.byteLength > 0 ? chunkBuffer : undefined,
    });

    const rangeHeader = driveRes.headers.get("range");
    const responseText = await driveRes.text();

    const headers: Record<string, string> = {};
    if (rangeHeader) {
      headers["range"] = rangeHeader;
    }

    return new NextResponse(responseText, {
      status: driveRes.status,
      headers,
    });
  } catch (error: unknown) {
    console.error("Gagal proxy chunk ke Google Drive:", error);
    const message = error instanceof Error ? error.message : "Gagal meneruskan chunk ke Google Drive.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    );
  }
}
