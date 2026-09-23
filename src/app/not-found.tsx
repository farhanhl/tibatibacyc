import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Rute Tidak Ditemukan | Tiba-Tiba Cycling",
  description: "Halaman atau rute yang Anda tuju tidak ditemukan.",
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-black text-[#EAE6DD] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Wallpaper with Dark Gradient Overlays matching Homepage */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/404-bg.webp"
          alt="404 Rute Gowes Tidak Ditemukan"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        {/* Dark Gradient Overlay exactly matching Homepage */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* 404 Card Content with Glassmorphic Transparency matching Homepage */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-6 bg-black/45 backdrop-blur-md border border-white/20 p-8 sm:p-12 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-[#EAE6DD] uppercase tracking-wider shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#C44341] animate-pulse"></span>
          <span>Jalur Gowes Terputus</span>
        </div>

        {/* 404 Large Display */}
        <div className="space-y-2">
          <h1
            className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-[#C44341] leading-none drop-shadow-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            404
          </h1>
          <h2
            className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight drop-shadow-md"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Nyasar Dari Rombongan?
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#EAE6DD] leading-relaxed font-sans max-w-md mx-auto font-medium drop-shadow-sm">
          Halaman atau rute yang kamu cari tidak ditemukan di peta. Jangan panik, yuk putar balik ke basecamp utama!
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-xs sm:text-sm tracking-wider rounded-sm shadow-2xl hover:shadow-[#C44341]/60 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span>←</span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
