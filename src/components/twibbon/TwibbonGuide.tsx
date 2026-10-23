"use client";

import React, { useState } from "react";

export default function TwibbonGuide() {
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const hashtags = "#TibaTibaCycling #GowesBekasi #KomunitasSepedaBekasi #CyclingBekasi #TibaTibaGowes";

  const handleCopyHashtags = () => {
    navigator.clipboard.writeText(hashtags).then(() => {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2500);
    });
  };

  const steps = [
    {
      num: "01",
      title: "Pilih Frame Twibbon",
      desc: "Pilih template twibbon resmi Tiba-Tiba Cycling yang ingin kamu gunakan.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Upload Foto Terbaik",
      desc: "Pilih foto gowes, potret diri, atau sepedamu dari galeri atau kamera HP.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Sesuaikan Posisi & Ukuran",
      desc: "Geser langsung di layar, perbesar (zoom in/out), putar rotasi, atau cerminkan foto hingga pas di frame.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ),
    },
    {
      num: "04",
      title: "Unduh & Siap Diposting",
      desc: "Klik Unduh Twibbon dalam resolusi HD. Siap dipasang di Instagram Story, WhatsApp Status, atau profil!",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-16 sm:mt-24 pt-12 border-t border-white/10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-block px-3 py-1 bg-[#C44341]/20 border border-[#C44341]/40 text-[#C44341] rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
          Panduan Praktis
        </span>
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Cara Pasang Twibbon
        </h2>
        <p className="text-sm sm:text-base text-[#868B96] mt-2">
          Ikuti langkah mudah berikut untuk membuat foto twibbon gowes kamu dalam hitungan detik.
        </p>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="relative bg-[#0E1426] border border-white/10 rounded-xl p-5 hover:border-[#C44341]/50 transition-colors flex flex-col group"
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-2xl font-black text-[#C44341]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {step.num}
              </span>
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#EAE6DD] group-hover:text-[#C44341] group-hover:bg-[#C44341]/10 transition-colors">
                {step.icon}
              </div>
            </div>
            <h3
              className="text-base font-bold text-white uppercase tracking-wide mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {step.title}
            </h3>
            <p className="text-xs text-[#868B96] leading-relaxed flex-1">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Social Media Sharing Banner & Hashtags */}
      <div className="mt-8 bg-gradient-to-r from-[#0E1426] via-[#141A2E] to-[#0E1426] border border-white/10 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C44341] animate-pulse" />
            <h4
              className="text-lg font-bold uppercase text-white tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bagikan ke Media Sosial & Tag Kami
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-[#868B96]">
            Upload hasil twibbon kamu ke Instagram Story / Feeds, jangan lupa tag{" "}
            <span className="text-[#C44341] font-semibold">@tibatiba.cyc</span> agar bisa kami repost!
          </p>
        </div>

        {/* Copy Hashtag Box */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-lg text-xs font-mono text-[#EAE6DD] truncate max-w-xs select-all">
            {hashtags}
          </div>
          <button
            type="button"
            onClick={handleCopyHashtags}
            className="px-4 py-2.5 bg-[#C44341] hover:bg-[#A93434] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {copiedHashtags ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tersalin!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Salin Hashtag
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

