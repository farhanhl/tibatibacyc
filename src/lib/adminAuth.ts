import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "tibatiba_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PIN ||
    "tibatiba_2026_cycling_session_fallback_secret"
  );
}

export function verifyAdminPin(pin: string): boolean {
  const configuredPin = process.env.ADMIN_PIN || "tibatiba2026";
  if (!pin || typeof pin !== "string") return false;
  return pin.trim() === configuredPin.trim();
}

/**
 * Membuat signed session token berformat:
 * payload_base64.signature_hex
 */
export function generateAdminSessionToken(): string {
  const now = Date.now();
  const payload = {
    role: "admin",
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
 * Memverifikasi validitas signed session token
 */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadStr)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false;

  try {
    const payloadJson = Buffer.from(payloadStr, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || typeof payload.exp !== "number") return false;
    return Date.now() < payload.exp;
  } catch {
    return false;
  }
}

/**
 * Mengecek apakah request memiliki cookie admin session yang valid (Server-Side)
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return verifyAdminSessionToken(token);
  } catch {
    return false;
  }
}

