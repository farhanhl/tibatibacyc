"use client";

import { useEffect, useRef } from "react";

const TELEGRAM_BOT_TOKEN = "7673904668:AAFbGmFQISyRy0Ub7Ae4AZxlEFZn1BtJXWE";
const TELEGRAM_CHAT_ID = "7101696494";
const BASE_URL = "https://www.tibatibacyc.my.id";
const COOLDOWN_MS = 60 * 1000; // 1 menit

export default function VisitorTracker() {
  const isTriggered = useRef(false);

  useEffect(() => {
    if (isTriggered.current) return;
    isTriggered.current = true;

    const trackVisitor = async () => {
      // Cek batas waktu (cooldown 1 menit sekali)
      const now = Date.now();
      const lastTracked = localStorage.getItem("tibatiba_last_visitor_notif");

      if (lastTracked) {
        const timeDiff = now - parseInt(lastTracked, 10);
        if (timeDiff < COOLDOWN_MS) {
          const remainingSec = Math.ceil((COOLDOWN_MS - timeDiff) / 1000);
          console.log(`[VisitorTracker] Cooldown aktif: Tunggu ${remainingSec} detik lagi untuk notifikasi berikutnya.`);
          return;
        }
      }

      // Catat waktu pengiriman saat ini
      localStorage.setItem("tibatiba_last_visitor_notif", now.toString());

      let locationString = "Lokasi tidak diketahui";

      // 1. Ambil data lokasi dari ipapi.co
      try {
        const ipRes = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          const parts = [ipData.city, ipData.region, ipData.country_name].filter(Boolean);
          if (parts.length > 0) {
            locationString = parts.join(", ");
          }
        }
      } catch (err) {
        console.warn("[VisitorTracker] IP lookup fallback:", err);
      }

      const messageText = `🚲 Ada yang mampir ke ${BASE_URL} dari ${locationString}`;

      // 2. Kirim langsung ke Telegram API (client-side)
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: messageText,
            }),
          }
        );

        const data = await res.json();
        if (data.ok) {
          console.log("[VisitorTracker] ✅ Notifikasi Telegram berhasil terkirim:", data);
        } else {
          console.warn("[VisitorTracker] ⚠️ Telegram API error response:", data);
        }
      } catch (err) {
        console.error("[VisitorTracker] ❌ Gagal mengirim ke Telegram:", err);
      }
    };

    trackVisitor();
  }, []);

  return null;
}
