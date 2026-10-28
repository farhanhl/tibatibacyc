"use client";

import React from "react";

export default function SettingsAdminTab() {
  return (
    <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h2
          className="text-xl font-black uppercase text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ⚙️ Status Koneksi & Konfigurasi Sistem
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Informasi layanan pihak ketiga yang terhubung ke website Tiba-Tiba Cycling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Box 1: Bot Telegram */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-gray-300 font-bold">
            <span>🤖 BOT TELEGRAM NOTIFIKASI</span>
            <span className="text-emerald-400">● TERHUBUNG</span>
          </div>
          <p className="text-gray-400">
            Mengirim notifikasi otomatis saat ada pengunjung baru dan saat tombol Join WhatsApp diklik.
          </p>
          <div className="pt-2 text-[11px] text-gray-500 space-y-0.5">
            <p>Target Chat ID: Konfigurasi .env</p>
          </div>
        </div>

        {/* Box 2: Database Online */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-gray-300 font-bold">
            <span>🗄️ DATABASE ONLINE (FIRESTORE)</span>
            <span className="text-emerald-400">● TERHUBUNG</span>
          </div>
          <p className="text-gray-400">
            Satu sistem database terpadu untuk kegiatan ride, foto, dan pengingat pop-up otomatis.
          </p>
          <div className="pt-2 text-[11px] text-gray-500 space-y-0.5">
            <p>Collections: events, visitor_counters, join_counters, merchandise_orders</p>
          </div>
        </div>

        {/* Box 3: Cloudinary Media Storage */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-gray-300 font-bold">
            <span>☁️ PENYIMPANAN FOTO (CLOUDINARY)</span>
            <span className="text-emerald-400">● TERHUBUNG</span>
          </div>
          <p className="text-gray-400">
            Penyimpanan foto dokumentasi dan poster instastory cepat langsung dari form admin.
          </p>
          <div className="pt-2 text-[11px] text-gray-500 space-y-0.5">
            <p>Unggah Langsung via Cloudinary Preset</p>
          </div>
        </div>

        {/* Box 4: Keamanan Admin */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-gray-300 font-bold">
            <span>🔐 KEAMANAN ADMIN</span>
            <span className="text-emerald-400">● TERLINDUNGI COOKIE & PIN</span>
          </div>
          <p className="text-gray-400">
            Akses ke dashboard pengelola diamankan dengan PIN server-side dan HTTP-Only secure cookie.
          </p>
        </div>
      </div>
    </div>
  );
}

