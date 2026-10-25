"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SizeChartItem } from "@/types/merchandise";

const SIZE_CHART: SizeChartItem[] = [
  { size: "S", panjang: 64, lebarDada: 50, lingkarDada: 100 },
  { size: "M", panjang: 66, lebarDada: 52, lingkarDada: 104 },
  { size: "L", panjang: 68, lebarDada: 55, lingkarDada: 110 },
  { size: "XL", panjang: 70, lebarDada: 58, lingkarDada: 116 },
  { size: "XXL", panjang: 72, lebarDada: 61, lingkarDada: 122 },
  { size: "3XL", panjang: 74, lebarDada: 64, lingkarDada: 128 },
];

export default function MerchandiseDetail({ onSelectOrder }: { onSelectOrder?: () => void }) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const features = [
    {
      title: "Bahan American Drill Premium",
      desc: "Kain tebal, kokoh, tidak mudah kusut, adem dipakai di cuaca Bekasi dan tahan terpaan angin ringan saat gowes.",
      icon: "🧵",
      tag: "Material Utama",
    },
    {
      title: "Sudah Termasuk Furing (Furring)",
      desc: "Bagian dalam dilapisi furing lembut yang nyaman di kulit dan rapi saat melapisi jersey maupun kaos santai.",
      icon: "🛡️",
      tag: "Included (Rp 185.000)",
    },
    {
      title: "Reflektor Keselamatan (Safety Reflector)",
      desc: "Strip scotchlite reflektif di kedua bahu depan dan belakang, memantulkan sinar lampu saat gowes subuh atau malam hari.",
      icon: "✨",
      tag: "Fitur Keselamatan",
    },
    {
      title: "Model Kantong & Warna Colorblock",
      desc: "Warna dasar Navy maskulin dengan saku utilitas kontras merah, hijau, & kuning. Dilengkapi resleting metal kokoh.",
      icon: "🎨",
      tag: "Tactical Style",
    },
    {
      title: "Ring D Depan (D-Ring Utility)",
      desc: "Ring gantung di saku kanan atas untuk cantelan kacamata gowes, carabiner, kunci sepeda, atau aksesoris.",
      icon: "🔘",
      tag: "Fungsional",
    },
    {
      title: "Desain Belakang: Sablon / Bordir (+20k)",
      desc: "Grafis ikonik TIBA-TIBA CYCLING di punggung. Tersedia versi sablon berkualitas (include) atau bordir komputer timbul (+Rp 20.000).",
      icon: "🪡",
      tag: "Pilihan Custom",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Product Image Showcase */}
      <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-[#0E1426] shadow-2xl group">
        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-[#C44341] text-white text-xs font-black uppercase tracking-wider rounded-md shadow-md">
            Official Merchandise
          </span>
          <span className="px-3 py-1 bg-black/75 backdrop-blur-md text-[#EAE6DD] text-xs font-mono font-bold uppercase tracking-wider rounded-md border border-white/10">
            Tactical Riding Vest
          </span>
        </div>

        {/* Zoom Hint Button */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="absolute top-4 right-4 z-10 p-2.5 bg-black/70 hover:bg-[#C44341] backdrop-blur-md text-white rounded-xl border border-white/15 transition-all shadow-lg flex items-center gap-1.5 text-xs font-mono"
          title="Klik untuk perbesar gambar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <span className="hidden sm:inline">Perbesar Foto</span>
        </button>

        {/* Main Product Image */}
        <div
          className="relative w-full aspect-[16/11] sm:aspect-[16/10] bg-[#12141A] cursor-zoom-in"
          onClick={() => setIsZoomOpen(true)}
        >
          <Image
            src="/images/merch/merch.jpeg"
            alt="Rompi Tiba-Tiba Cycling Official Tactical Riding Vest"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            priority
          />
        </div>

        {/* Bottom Palette Indicator */}
        <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400 font-bold uppercase">Palet Warna:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-300">
                <span className="w-3.5 h-3.5 rounded-full bg-[#1E2538] border border-white/30 inline-block shadow-inner" />
                Navy
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-300">
                <span className="w-3.5 h-3.5 rounded-full bg-[#C44341] border border-white/30 inline-block shadow-inner" />
                Red
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-300">
                <span className="w-3.5 h-3.5 rounded-full bg-[#1C674E] border border-white/30 inline-block shadow-inner" />
                Green
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-300">
                <span className="w-3.5 h-3.5 rounded-full bg-[#E5A823] border border-white/30 inline-block shadow-inner" />
                Yellow
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSizeChart(true)}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#C44341] hover:text-white transition-colors"
          >
            <span>📏 Lihat Panduan Ukuran (Size Chart)</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Product Quick Info & Pricing Box */}
      <div className="p-6 rounded-2xl bg-[#12141A] border border-white/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#C44341] font-bold tracking-widest uppercase block">
              Koleksi Spesial Komunitas
            </span>
            <h2
              className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="block">Tactical Riding Vest</span>
              <span className="block text-[#C44341]">Tiba-Tiba Cycling</span>
            </h2>
          </div>
          <div className="text-left sm:text-right sm:shrink-0 flex flex-col sm:items-end">
            <span className="text-[10px] font-mono uppercase text-gray-400 block text-left sm:text-right">
              Harga Pre-Order
            </span>
            <span
              className="text-3xl sm:text-4xl font-black text-[#C44341] block text-left sm:text-right leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Rp 185.000
            </span>
            <span className="text-[11px] font-mono text-gray-400 block text-left sm:text-right mt-0.5">
              *Versi bordir belakang: Rp 205.000 (+20k)
            </span>
          </div>
        </div>

        <p className="text-sm text-[#EAE6DD] leading-relaxed">
          Rompi sepeda eksklusif bernuansa tactical utilitarian yang dirancang khusus untuk anggota dan kawan-kawan Tiba-Tiba Cycling Bekasi. Nyaman dipakai saat melibas aspal akhir pekan, tahan terpaan angin, saku banyak untuk bawa HP & toolkit, dan tetap kece saat mampir ngopi santai.
        </p>

        {onSelectOrder && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onSelectOrder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C44341] hover:bg-[#A93434] text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#C44341]/40"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span>📝 Isi Form Pre-Order Sekarang</span>
              <span>↓</span>
            </button>
          </div>
        )}
      </div>

      {/* Feature Breakdown Grid */}
      <div className="space-y-4">
        <h3
          className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="w-2.5 h-6 bg-[#C44341] rounded-sm inline-block" />
          Detail & Spesifikasi Lengkap
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-black/60 border border-white/10 hover:border-[#C44341]/50 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {item.tag}
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-[#C44341] transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center bg-[#12141A] rounded-2xl border border-white/20 p-2 sm:p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 px-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white uppercase">
                Preview Detail Desain Rompi Tiba-Tiba Cycling
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full h-[70vh] sm:h-[75vh] mt-2">
              <Image
                src="/images/merch/merch.jpeg"
                alt="Detail Rompi Tiba-Tiba Cycling"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowSizeChart(false)}
        >
          <div
            className="relative max-w-lg w-full bg-[#12141A] rounded-2xl border border-white/20 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono text-[#C44341] font-bold uppercase">Panduan Ukuran</span>
                <h3
                  className="text-2xl font-black uppercase text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Size Chart Rompi (Vest)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeChart(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Ukuran standar lokal dalam satuan centimeter (cm). Disarankan memilih 1 tingkat lebih besar jika ingin dipakai dengan jaket / hoodie tebal.
            </p>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-black/60 text-gray-300 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3 text-center">Panjang (cm)</th>
                    <th className="py-2.5 px-3 text-center">Lebar Dada (cm)</th>
                    <th className="py-2.5 px-3 text-center">Lingkar Dada (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {SIZE_CHART.map((sc) => (
                    <tr key={sc.size} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#C44341]">{sc.size}</td>
                      <td className="py-2.5 px-3 text-center">{sc.panjang}</td>
                      <td className="py-2.5 px-3 text-center">{sc.lebarDada}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-white">{sc.lingkarDada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-gray-400">
              💡 *Toleransi ukuran jahitan sekitar 1-2 cm pada saat proses konveksi.*
            </div>

            <button
              type="button"
              onClick={() => setShowSizeChart(false)}
              className="w-full py-2.5 bg-[#C44341] hover:bg-[#A93434] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
