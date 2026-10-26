"use client";

import React, { useEffect } from "react";
import { SizeChartItem } from "@/types/merchandise";

export const SIZE_CHART: SizeChartItem[] = [
  { size: "S", lebar: 51, lebarDada: 51, panjang: 66, lingkarDada: 102 },
  { size: "M", lebar: 53, lebarDada: 53, panjang: 68, lingkarDada: 106 },
  { size: "L", lebar: 55, lebarDada: 55, panjang: 70, lingkarDada: 110 },
  { size: "XL", lebar: 57, lebarDada: 57, panjang: 72, lingkarDada: 114 },
  { size: "2XL", lebar: 59, lebarDada: 59, panjang: 74, lingkarDada: 118 },
  { size: "3XL", lebar: 61, lebarDada: 61, panjang: 76, lingkarDada: 122 },
  { size: "4XL", lebar: 63, lebarDada: 63, panjang: 78, lingkarDada: 126 },
  { size: "5XL", lebar: 65, lebarDada: 65, panjang: 78, lingkarDada: 130 },
];

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export default function SizeChartModal({
  isOpen,
  onClose,
  selectedSize,
  onSelectSize,
}: SizeChartModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-[#12141A] rounded-2xl border border-white/20 p-5 sm:p-7 space-y-5 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C44341]/20 border border-[#C44341]/50 text-[#C44341] text-[10px] font-mono font-bold uppercase tracking-wider">
                Panduan Ukuran
              </span>
              <span className="text-gray-400 text-xs font-mono">Official Tactical Vest</span>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              SIZE CHART <span className="text-[#C44341]">ROMPI REGULER</span>
            </h3>
            <p className="text-[11px] sm:text-xs font-mono text-gray-400">
              Single Layer, Furing Asahi & Furing Jaring (satuan cm)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-base shrink-0"
            aria-label="Tutup Panduan"
          >
            ✕
          </button>
        </div>

        {/* Visual Vest Illustration & Measurement Arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-black/40 rounded-xl p-4 border border-white/10">
          {/* Vest Graphic */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-44 h-48 flex items-center justify-center">
              {/* Vest SVG Outline */}
              <svg
                viewBox="0 0 200 230"
                className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Vest Body */}
                <path
                  d="M50 25 C65 25 75 40 75 55 C75 75 100 85 100 85 C100 85 125 75 125 55 C125 40 135 25 150 25 L175 35 L160 90 C150 90 152 110 155 120 L155 210 L45 210 L45 120 C48 110 50 90 40 90 L25 35 Z"
                  fill="#1C2430"
                  stroke="#3A4659"
                  strokeWidth="2.5"
                />
                {/* Zipper Center */}
                <line
                  x1="100"
                  y1="85"
                  x2="100"
                  y2="210"
                  stroke="#606B7D"
                  strokeWidth="2.5"
                  strokeDasharray="2 2"
                />
                {/* Collar */}
                <path
                  d="M75 55 C85 70 100 85 100 85 C100 85 115 70 125 55"
                  stroke="#C44341"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Arrow PANJANG (Vertical) */}
                <g>
                  {/* Line */}
                  <line
                    x1="65"
                    y1="30"
                    x2="65"
                    y2="205"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                  />
                  {/* Arrow top */}
                  <polygon points="65,24 60,33 70,33" fill="#EF4444" />
                  {/* Arrow bottom */}
                  <polygon points="65,211 60,202 70,202" fill="#EF4444" />
                  {/* Text Badge */}
                  <rect
                    x="53"
                    y="108"
                    width="24"
                    height="18"
                    rx="4"
                    fill="#12141A"
                    stroke="#EF4444"
                    strokeWidth="1.2"
                  />
                  <text
                    x="65"
                    y="121"
                    fill="#EF4444"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    P
                  </text>
                </g>

                {/* Arrow LEBAR (Horizontal) */}
                <g>
                  {/* Line */}
                  <line
                    x1="38"
                    y1="140"
                    x2="162"
                    y2="140"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                  />
                  {/* Arrow left */}
                  <polygon points="32,140 41,135 41,145" fill="#EF4444" />
                  {/* Arrow right */}
                  <polygon points="168,140 159,135 159,145" fill="#EF4444" />
                  {/* Text Badge */}
                  <rect
                    x="108"
                    y="131"
                    width="24"
                    height="18"
                    rx="4"
                    fill="#12141A"
                    stroke="#EF4444"
                    strokeWidth="1.2"
                  />
                  <text
                    x="120"
                    y="144"
                    fill="#EF4444"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    L
                  </text>
                </g>
              </svg>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span>↕</span> P: Panjang
              </span>
              <span className="text-red-400 font-bold flex items-center gap-1">
                <span>↔</span> L: Lebar Dada
              </span>
            </div>
          </div>

          {/* Quick Guide Points */}
          <div className="sm:col-span-7 space-y-2.5 text-xs text-gray-300">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <span className="font-bold text-white block">Cara Pengukuran Rompi:</span>
              <p className="text-gray-300 leading-relaxed text-[11px]">
                <strong className="text-white">Lebar:</strong> Diukur mendatar dari bawah ketiak kiri ke ketiak kanan.
                <br />
                <strong className="text-white">Panjang:</strong> Diukur tegak lurus dari titik pundak tertinggi sampai ujung bawah rompi.
              </p>
            </div>

            {/* Toleransi Ukuran Note */}
            <div className="p-2.5 rounded-lg bg-black/60 border border-[#C44341]/40 text-center">
              <span className="text-[11px] font-mono font-bold text-white block">
                Note : Toleransi Ukuran Kurang Lebih 1-2cm
              </span>
              <span className="text-[10px] text-gray-400">
                Wajar pada proses pemotongan kain & penjahitan rompi
              </span>
            </div>
          </div>
        </div>

        {/* Size Table matching image */}
        <div className="overflow-x-auto rounded-xl border border-white/15 shadow-inner">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-[#C44341] text-white uppercase font-black tracking-wider">
              <tr>
                <th className="py-2.5 px-4">SIZE</th>
                <th className="py-2.5 px-4 text-center">LEBAR (cm)</th>
                <th className="py-2.5 px-4 text-center">PANJANG (cm)</th>
                <th className="py-2.5 px-4 text-center">LINGKAR DADA (cm)</th>
                {onSelectSize && <th className="py-2.5 px-4 text-center">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/60 text-gray-200">
              {SIZE_CHART.map((sc) => {
                const isSelected = selectedSize === sc.size;
                return (
                  <tr
                    key={sc.size}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-[#C44341]/20 font-bold"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <td className="py-2.5 px-4 font-black text-white text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[#C44341]">{sc.size}</span>
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#C44341] text-white rounded">
                            Dipilih
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-100">
                      {sc.lebar}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-100">
                      {sc.panjang}
                    </td>
                    <td className="py-2.5 px-4 text-center text-gray-400">
                      ~{sc.lingkarDada}
                    </td>
                    {onSelectSize && (
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSize(sc.size);
                            onClose();
                          }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all ${
                            isSelected
                              ? "bg-white text-black font-black"
                              : "bg-[#C44341] hover:bg-[#A93434] text-white"
                          }`}
                        >
                          {isSelected ? "Terpilih" : "Pilih"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & Close */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-gray-400 font-mono text-center sm:text-left">
            💡 <strong className="text-gray-300">Tips:</strong> Jika sering memakai hoodie / jaket gowes di dalam rompi, disarankan naik 1 size.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shrink-0"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
