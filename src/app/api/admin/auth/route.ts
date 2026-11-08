import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPin,
  generateAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// In-memory rate limiting map for login attempts
interface RateLimitRecord {
  failedAttempts: number;
  lockedUntil: number;
  lastAttempt: number;
}

const loginAttemptsMap = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown-ip";
}

function cleanOldRateLimitRecords() {
  const now = Date.now();
  for (const [ip, record] of loginAttemptsMap.entries()) {
    if (now > record.lockedUntil && now - record.lastAttempt > LOCKOUT_DURATION_MS * 2) {
      loginAttemptsMap.delete(ip);
    }
  }
}

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
 * Dilengkapi pembatasan percobaan gagal (Rate Limit) per IP
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  cleanOldRateLimitRecords();

  const record = loginAttemptsMap.get(ip);
  if (record && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam ${remainingMinutes} menit.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const pin = body?.pin;

    if (!pin || !verifyAdminPin(pin)) {
      const currentRecord = record || { failedAttempts: 0, lockedUntil: 0, lastAttempt: now };
      currentRecord.failedAttempts += 1;
      currentRecord.lastAttempt = now;

      if (currentRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        currentRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
        loginAttemptsMap.set(ip, currentRecord);
        return NextResponse.json(
          {
            success: false,
            error: `Terlalu banyak percobaan PIN salah (${MAX_FAILED_ATTEMPTS}x). Akses dikunci sementara selama 15 menit.`,
          },
          { status: 429 }
        );
      }

      loginAttemptsMap.set(ip, currentRecord);
      const remainingAttempts = MAX_FAILED_ATTEMPTS - currentRecord.failedAttempts;

      return NextResponse.json(
        {
          success: false,
          error: `PIN Admin tidak valid. Sisa percobaan: ${remainingAttempts} kali.`,
        },
        { status: 401 }
      );
    }

    // Login berhasil: reset rate limit IP
    loginAttemptsMap.delete(ip);

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

