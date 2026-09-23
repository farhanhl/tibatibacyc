"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const COOLDOWN_MS = 60 * 1000; // 1 menit

export default function VisitorTracker() {
  const pathname = usePathname();
  const isTriggered = useRef(false);

  useEffect(() => {
    // Hanya hitung visitor jika pengguna berada di halaman utama ('/')
    if (pathname !== "/") return;

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

      // 2. Kirim ke Server API (/api/visitor)
      // Server akan mencatat hitungan pengunjung hari ini & mengirim pesan ke bot Telegram
      try {
        const res = await fetch("/api/visitor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: locationString,
          }),
        });

        const data = await res.json();
        if (data.success) {
          console.log("[VisitorTracker] ✅ Notifikasi Telegram & counter berhasil diproses:", data);
        } else {
          console.warn("[VisitorTracker] ⚠️ Visitor API response:", data);
        }
      } catch (err) {
        console.error("[VisitorTracker] ❌ Gagal memproses notifikasi visitor:", err);
      }
    };

    trackVisitor();
  }, []);

  return null;
}
