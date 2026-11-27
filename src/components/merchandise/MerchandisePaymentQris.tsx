"use client";

import React, { useState } from "react";
import Image from "next/image";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";

const profile = profileData as ProfileData;

export default function MerchandisePaymentQris() {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <section
      id="payment-qris"
      className="p-6 sm:p-8 rounded-2xl bg-[#12141A] border border-white/15 shadow-2xl space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left: QRIS Image Card */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div
            onClick={() => setIsZoomOpen(true)}
            className="relative w-full max-w-[280px] aspect-[874/1240] rounded-2xl overflow-hidden bg-white border-2 border-white/20 shadow-xl cursor-zoom-in group"
            title="Klik untuk memperbesar QRIS"
          >
            <Image
              src="/images/payment/qris.jpeg"
              alt="QRIS Pembayaran Merchandise Tiba-Tiba Cycling - FARHAN STORE IND"
              width={874}
              height={1240}
              className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
            />
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[10px] font-mono font-bold backdrop-blur-sm border border-white/15">
              🔍 Perbesar
            </span>
          </div>
        </div>

        {/* Right: Payment Instructions & Actions */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              💳 Metode Pembayaran Resmi
            </span>
            <h3
              className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pembayaran via QRIS
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bagi peserta pre-order Batch #1 yang sudah tercatat di daftar pesanan, pembayaran dapat dilakukan melalui scan QRIS di samping menggunakan aplikasi m-banking atau e-wallet apa saja.
            </p>
          </div>

          {/* Merchant Info Box */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400">Nama Merchant:</span>
              <span className="text-white font-bold">FARHAN STORE IND</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-400">NMID:</span>
              <span className="text-gray-200 font-bold">ID1020042190279</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/images/payment/qris.jpeg"
              download="QRIS-TibaTiba-Cycling.jpeg"
              className="flex-1 py-3 px-4 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#C44341]/40 flex items-center justify-center gap-2 text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span>⬇️ Download Gambar QRIS</span>
            </a>

            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              🔍 Perbesar QRIS
            </button>

            <a
              href="https:/wa.me/62895616060962"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs rounded-xl transition-colors text-center"
            >
              💬 Konfirmasi Bukti Bayar
            </a>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-md w-full bg-[#12141A] rounded-2xl border border-white/20 p-3 sm:p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-white uppercase">
                QRIS — FARHAN STORE IND
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm cursor-pointer"
                aria-label="Tutup QRIS"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full aspect-[874/1240] rounded-xl overflow-hidden bg-white">
              <Image
                src="/images/payment/qris.jpeg"
                alt="QRIS Pembayaran Merchandise Tiba-Tiba Cycling - FARHAN STORE IND"
                width={874}
                height={1240}
                className="w-full h-full object-contain"
              />
            </div>
            <a
              href="/images/payment/qris.jpeg"
              download="QRIS-TibaTiba-Cycling.jpeg"
              className="w-full py-3 px-4 bg-[#C44341] hover:bg-[#A93434] text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>⬇️ Download QRIS</span>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
