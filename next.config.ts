import type { NextConfig } from "next";

// Daftar Environment Variables yang WAJIB ada di file .env / .env.local
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "NEXT_PUBLIC_SITE_URL",
];

// Validasi environment variables saat build / start
const missingEnv = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key]?.trim() === ""
);

if (missingEnv.length > 0) {
  const errorMessage = `
================================================================================
🚨 [BUILD ERROR] Terdapat Environment Variable (.env) yang BELUM DIISI!
--------------------------------------------------------------------------------
Variabel berikut wajib tersedia agar aplikasi dapat berjalan dengan benar:

${missingEnv.map((v) => `  ❌ ${v}`).join("\n")}

Silakan lengkapi variabel tersebut di file .env / .env.local atau di dashboard hosting Anda (Vercel / Cloud).
================================================================================
`;
  console.error(errorMessage);
  throw new Error(
    `[ENV VALIDATION FAILED] Missing required environment variables: ${missingEnv.join(", ")}`
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
