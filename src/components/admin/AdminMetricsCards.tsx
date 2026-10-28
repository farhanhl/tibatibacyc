"use client";

import React from "react";
import { EventItem } from "@/types/profile";
import { calculateDaysRemaining } from "@/lib/scheduleService";

interface AdminMetricsCardsProps {
  todayVisitors: number;
  yesterdayVisitors: number;
  totalVisitorsAllTime: number;
  todayJoins: number;
  totalJoinsAllTime: number;
  eventsCount: number;
  upcomingEventsCount: number;
  completedEventsCount: number;
  activeUpcomingPopupEvent?: EventItem;
}

export default function AdminMetricsCards({
  todayVisitors,
  yesterdayVisitors,
  totalVisitorsAllTime,
  todayJoins,
  totalJoinsAllTime,
  eventsCount,
  upcomingEventsCount,
  completedEventsCount,
  activeUpcomingPopupEvent,
}: AdminMetricsCardsProps) {
  const visitorDiff = todayVisitors - yesterdayVisitors;
  const isPositiveGrowth = visitorDiff >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Pengunjung Hari Ini */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400">
          <span>PENGUNJUNG HARI INI</span>
          <span className="text-base">👀</span>
        </div>
        <div className="flex items-baseline justify-between">
          <p
            className="text-3xl font-black text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {todayVisitors}
          </p>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              isPositiveGrowth
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                : "bg-red-950/80 text-red-400 border border-red-500/30"
            }`}
          >
            {isPositiveGrowth ? `+${visitorDiff}` : visitorDiff} vs krm
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-mono">
          Total All-Time: {totalVisitorsAllTime} kunjungan
        </p>
      </div>

      {/* Card 2: Klik Join WhatsApp Hari Ini */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400">
          <span>KLIK JOIN WA HARI INI</span>
          <span className="text-base">🤝</span>
        </div>
        <div className="flex items-baseline justify-between">
          <p
            className="text-3xl font-black text-[#C44341]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {todayJoins}
          </p>
          <span className="text-[11px] font-mono text-gray-300 bg-black/60 px-2 py-0.5 rounded border border-white/10">
            Konversi:{" "}
            {todayVisitors > 0
              ? ((todayJoins / todayVisitors) * 100).toFixed(0) + "%"
              : "0%"}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-mono">
          Total All-Time: {totalJoinsAllTime} klik
        </p>
      </div>

      {/* Card 3: Total Kegiatan & Jadwal */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400">
          <span>TOTAL KEGIATAN & JADWAL</span>
          <span className="text-base">🚴</span>
        </div>
        <div className="flex items-baseline justify-between">
          <p
            className="text-3xl font-black text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {eventsCount}
          </p>
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            {upcomingEventsCount} Mendatang • {completedEventsCount} Selesai
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-mono">
          Tersimpan di Firestore Database
        </p>
      </div>

      {/* Card 4: Status Pop-up Reminder Aktif */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400">
          <span>POP-UP PENGINGAT H-5</span>
          <span className="text-base">🔔</span>
        </div>
        <div>
          {activeUpcomingPopupEvent ? (
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C44341] text-white">
                {
                  calculateDaysRemaining(
                    activeUpcomingPopupEvent.date,
                    activeUpcomingPopupEvent.time
                  ).label
                }
              </span>
              <p className="text-sm font-bold text-white truncate max-w-[200px]">
                {activeUpcomingPopupEvent.name}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                TIDAK TAMPIL
              </span>
              <p className="text-xs text-gray-400 font-mono">
                Tidak ada jadwal H-5 aktif
              </p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 font-mono">
          Hanya muncul di halaman utama
        </p>
      </div>
    </div>
  );
}

