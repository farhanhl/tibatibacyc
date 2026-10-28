"use client";

import React from "react";
import Link from "next/link";

interface AdminHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function AdminHeader({
  isLoading,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/55 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#C44341] flex items-center justify-center text-xl text-white shadow-lg shrink-0">
          🚲
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Admin Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Tiba-Tiba Cycling Community Control Center
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
        >
          <span>🔄</span>
          <span>{isLoading ? "Memuat..." : "Refresh"}</span>
        </button>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-xs font-mono font-bold text-white uppercase tracking-wider transition-all shadow-md hover:shadow-[#C44341]/40"
        >
          <span>Lihat Website</span>
          <span>↗</span>
        </Link>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-xs font-mono text-red-300 transition-colors cursor-pointer"
        >
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}

