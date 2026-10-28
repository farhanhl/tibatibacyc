import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPin,
  generateAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/auth
 * Cek apakah session cookie admin saat ini masih valid
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isValid = verifyAdminSessionToken(token);

  return NextResponse.json({
    authenticated: isValid,
  });
}

/**
 * POST /api/admin/auth
 * Verifikasi PIN Admin dan terbitkan HTTP-only session cookie
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pin = body?.pin;

    if (!pin || !verifyAdminPin(pin)) {
      return NextResponse.json(
        {
          success: false,
          error: "PIN Admin tidak valid",
        },
        { status: 401 }
      );
    }

    const sessionToken = generateAdminSessionToken();
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Set secure HTTP-only cookie (7 hari)
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 hari dalam detik
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Logout dan bersihkan session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Logout berhasil",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

