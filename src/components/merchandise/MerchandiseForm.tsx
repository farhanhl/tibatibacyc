"use client";

import React, { useState } from "react";
import Link from "next/link";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";
import SizeChartModal from "@/components/merchandise/SizeChartModal";

const profile = profileData as ProfileData;

export default function MerchandiseForm() {
  const [showSizeModal, setShowSizeModal] = useState(false);

  return (
    <div
      id="order-form"
      className="relative p-6 sm:p-8 rounded-2xl bg-[#12141A] border border-white/20 shadow-2xl space-y-6"
    >
      {/* Top Header */}
      <div className="space-y-1 border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-gray-300 text-[11px] font-mono font-bold uppercase tracking-wider">
            Pre-Order Closed
          </span>
          <span className="text-xs font-mono text-gray-400">Batch #1</span>
        </div>
        <h3
          className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Pre-Order Ditutup
        </h3>
      </div>

      {/* Closed Notice Box */}
      <div className="p-6 rounded-xl bg-black/60 border border-[#C44341]/40 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#C44341]/15 border border-[#C44341]/40 flex items-center justify-center text-2xl">
          🔒
        </div>

        <div className="space-y-2">
          <p
            className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-snug"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sampai bertemu di pre order selanjutnya
          </p>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Pemesanan Pre-Order Tactical Riding Vest Batch #1 telah resmi ditutup. Terima kasih banyak untuk teman-teman yang sudah berpartisipasi!
          </p>
        </div>

        <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-gray-400 space-y-2">
          <p>
            Sudah melakukan pemesanan? Cek status pesanan kamu pada daftar pesanan atau lakukan pembayaran via QRIS di bawah.
          </p>
          <a
            href="#payment-qris"
            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4"
          >
            <span>💳 Lihat QRIS Pembayaran</span>
            <span>↓</span>
          </a>
        </div>
      </div>

      {/* Helpful Links / Actions */}
      <div className="space-y-3">
        <a
          href={profile.community.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-5 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-xs sm:text-sm tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#C44341]/40 flex items-center justify-center gap-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>💬 Gabung Grup WhatsApp untuk Info Batch Selanjutnya</span>
          <span>→</span>
        </a>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setShowSizeModal(true)}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            📏 Lihat Size Chart
          </button>
          <Link
            href="/"
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white font-mono font-bold text-xs rounded-xl transition-colors text-center"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
      />
    </div>
  );
}
