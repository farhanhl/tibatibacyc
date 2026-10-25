"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const STORAGE_KEY = "ttc_merch_modal_dismissed_v1";

export default function MerchandiseAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Tampilkan modal setelah jeda singkat (1.2 detik)
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setIsDismissed(true);
      }
    } catch {
      // Abaikan jika sessionStorage tidak diizinkan
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  const handleOpenManual = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Pill Reminder jika modal sudah ditutup */}
      {isDismissed && !isOpen && (
        <button
          type="button"
          onClick={handleOpenManual}
          className="fixed bottom-5 left-5 z-40 px-3.5 py-2 rounded-full bg-[#12141A]/90 hover:bg-[#C44341] text-white border border-white/20 hover:border-[#C44341] shadow-2xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer group text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-2 duration-300"
          aria-label="Buka Informasi Merchandise Rompi"
        >
          <span className="text-base group-hover:scale-110 transition-transform">👕</span>
          <span className="hidden sm:inline">Info Rompi Tiba-Tiba Cycling</span>
          <span className="sm:hidden">Rompi Merch</span>
          <span className="w-2 h-2 rounded-full bg-[#C44341] group-hover:bg-white animate-pulse" />
        </button>
      )}

      {/* Main Announcement Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-[#12141A] border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white z-10 animate-in zoom-in-95 fade-in duration-300">
            {/* Top Accent Bar: Merah dan Hitam */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#C44341] to-black" />

            <div className="p-5 sm:p-7 space-y-4">
              {/* Header: Tag & Close */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C44341]/20 border border-[#C44341]/50 text-[#C44341] text-xs font-mono font-bold uppercase tracking-wider">
                  <span>👕 Official Merchandise</span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
                  aria-label="Tutup Pengumuman"
                >
                  ✕
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <p className="text-[11px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                  Kabar Terbaru Komunitas
                </p>
                <h3
                  className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Rompi Resmi Tiba-Tiba Cycling
                </h3>
              </div>

              {/* Image Preview */}
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-black/70">
                <Image
                  src="/images/merch/merch.jpeg"
                  alt="Official Vest Tiba-Tiba Cycling"
                  fill
                  sizes="(max-width: 640px) 90vw, 400px"
                  className="object-contain p-1"
                />
                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-[#C44341]">
                  Mulai Rp 185.000
                </div>
              </div>

              {/* Brief Information */}
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Tiba-Tiba Cycling sedang membuka pre-order <strong className="text-white">Tactical Riding Vest</strong> resmi! Dibuat dengan bahan American Drill, lapisan furing nyaman, reflektor keselamatan, & saku utility colorblock.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/merchandise"
                  onClick={handleClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#C44341]/50 cursor-pointer text-center"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span>Lihat Detail Merchandise</span>
                  <span>→</span>
                </Link>

                <button
                  type="button"
                  onClick={handleClose}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
