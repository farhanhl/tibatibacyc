import crypto from "crypto";
import { cookies } from "next/headers";
import { AdminTabId } from "@/types/admin";

export const ADMIN_COOKIE_NAME = "tibatiba_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export const ALL_ADMIN_TABS: AdminTabId[] = [
  "overview",
  "events",
  "media",
  "merchandise",
  "settings",
  "pins",
];

export interface AdminSessionPayload {
  role: "super_admin" | "custom_admin";
  label: string;
  allowedTabs: AdminTabId[];
  issuedAt: number;
  exp: number;
}

function getSecretKey(): string {
  if (process.env.ADMIN_SESSION_SECRET) {
    return process.env.ADMIN_SESSION_SECRET;
  }
  if (process.env.ADMIN_PIN) {
    return process.env.ADMIN_PIN;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET wajib dikonfigurasi di Environment Variables!");
  }
  return "tibatiba_dev_fallback_secret_only";
}

/**
 * Memverifikasi apakah PIN cocok dengan Master PIN Super Admin di .env
 */
export function verifySuperAdminPin(pin: string): boolean {
  const configuredPin = process.env.ADMIN_PIN;
  if (!configuredPin) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL: ADMIN_PIN belum dikonfigurasi di environment variables!");
      return false;
    }
    // Fallback khusus development lokal
    return typeof pin === "string" && pin.trim() === "tibatiba2026";
  }
  if (!pin || typeof pin !== "string") return false;
  return pin.trim() === configuredPin.trim();
}

/**
 * Backward compatibility alias untuk verifySuperAdminPin
 */
export function verifyAdminPin(pin: string): boolean {
  return verifySuperAdminPin(pin);
}

/**
 * Membuat signed session token berformat:
 * payload_base64.signature_hex
 */
export function generateAdminSessionToken(payloadInput: {
  role: "super_admin" | "custom_admin";
  label: string;
  allowedTabs: AdminTabId[];
}): string {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    role: payloadInput.role,
    label: payloadInput.label,
    allowedTabs: payloadInput.allowedTabs,
    issuedAt: now,
    exp: now + SESSION_DURATION_MS,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadStr)
    .digest("hex");

  return `${payloadStr}.${signature}`;
}

/**
 * Memverifikasi validitas signed session token dan mengembalikan payload jika valid
 */
export function verifyAdminSessionToken(token: string | undefined | null): AdminSessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadStr)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payloadJson = Buffer.from(payloadStr, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || typeof payload.exp !== "number") return null;
    if (Date.now() >= payload.exp) return null;

    // Backward compatibility untuk sesi lama yang hanya berisi role: "admin"
    if (payload.role === "admin" && !payload.allowedTabs) {
      return {
        role: "super_admin",
        label: "Super Admin",
        allowedTabs: ALL_ADMIN_TABS,
        issuedAt: payload.issuedAt || Date.now(),
        exp: payload.exp,
      };
    }

    return {
      role: payload.role || "custom_admin",
      label: payload.label || "Admin",
      allowedTabs: Array.isArray(payload.allowedTabs) ? payload.allowedTabs : ["events"],
      issuedAt: payload.issuedAt || Date.now(),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Mengambil session admin saat ini dari cookie (Server-Side)
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return verifyAdminSessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Mengecek apakah request memiliki session Super Admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "super_admin";
}

/**
 * Mengecek apakah request memiliki session admin yang valid (Server-Side)
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}
