import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Memastikan nilai konfigurasi Firebase valid dan bukan placeholder/dummy dev.
 * Jika kosong atau diawali "dev_", otomatis gunakan kredensial resmi.
 */
function getValidConfigValue(val: string | undefined, fallback: string): string {
  if (!val || typeof val !== "string") return fallback;
  const trimmed = val.trim();
  if (trimmed === "" || trimmed.startsWith("dev_") || trimmed.includes("dummy")) {
    return fallback;
  }
  return trimmed;
}

const firebaseConfig = {
  apiKey: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    "AIzaSyAdTGy_Ca6u16GxeKy8_cbdPyHEHop-_Kw"
  ),
  authDomain: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "tibatibacyc-954d4.firebaseapp.com"
  ),
  projectId: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    "tibatibacyc-954d4"
  ),
  storageBucket: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "tibatibacyc-954d4.firebasestorage.app"
  ),
  messagingSenderId: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "537246320383"
  ),
  appId: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    "1:537246320383:web:cb29e1dd46ec507bbf2eca"
  ),
  measurementId: getValidConfigValue(
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    "G-CXRNRW69SS"
  ),
};

// Singleton Firebase initialization
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

export { app, db };
