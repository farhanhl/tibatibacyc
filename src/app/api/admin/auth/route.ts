import { NextRequest, NextResponse } from "next/server";
import {
  verifySuperAdminPin,
  generateAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ALL_ADMIN_TABS,
} from "@/lib/adminAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

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
 * Cek apakah session cookie admin saat ini masih valid dan ambil info role & hak akses
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = verifyAdminSessionToken(token);

  if (!session) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    role: session.role,
    label: session.label,
    allowedTabs: session.allowedTabs,
  });
}

/**
 * POST /api/admin/auth
 * Verifikasi PIN Admin (Super Admin Master PIN atau PIN Custom dari Database)
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
        error: `Terlalu banyak percobaan login yang gagal. Akses dikunci sementara selama ${remainingMinutes} menit.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawPin = body?.pin;

    if (!rawPin || typeof rawPin !== "string" || !rawPin.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "PIN Admin wajib diisi",
        },
        { status: 400 }
      );
    }

    const pin = rawPin.trim();
    let sessionPayload: {
      role: "super_admin" | "custom_admin";
      label: string;
      allowedTabs: any[];
    } | null = null;

    // 1. Cek apakah cocok dengan Super Admin Master PIN (.env)
    if (verifySuperAdminPin(pin)) {
      sessionPayload = {
        role: "super_admin",
        label: "Super Admin",
        allowedTabs: ALL_ADMIN_TABS,
      };
    } else {
      // 2. Cek apakah cocok dengan salah satu PIN kustom di Firestore
      try {
        const q = query(
          collection(db, "admin_pins"),
          where("pin", "==", pin),
          where("isActive", "==", true),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docData = snap.docs[0].data();
          sessionPayload = {
            role: "custom_admin",
            label: docData.label || "Admin",
            allowedTabs: Array.isArray(docData.allowedTabs) && docData.allowedTabs.length > 0
              ? docData.allowedTabs
              : ["events"],
          };
        }
      } catch (dbErr) {
        console.error("Gagal memeriksa PIN di Firestore:", dbErr);
      }
    }

    // Jika PIN tidak cocok dengan Master PIN maupun PIN Kustom
    if (!sessionPayload) {
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

    const sessionToken = generateAdminSessionToken(sessionPayload);
    const response = NextResponse.json({
      success: true,
      message: `Login berhasil sebagai ${sessionPayload.label}`,
      role: sessionPayload.role,
      label: sessionPayload.label,
      allowedTabs: sessionPayload.allowedTabs,
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
    console.error("Admin Auth Error:", error);
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
