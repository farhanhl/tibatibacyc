"use client";

import React from "react";

export interface DailyStat {
  dateKey: string;
  formattedDate: string;
  visitors: number;
  joins: number;
  conversionRate: string;
}

interface OverviewAdminTabProps {
  dailyStats: DailyStat[];
  todayKey: string;
}

export default function OverviewAdminTab({
  dailyStats,
  todayKey,
}: OverviewAdminTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2
              className="text-xl font-black uppercase text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Riwayat Pengunjung & Konversi Harian
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Data diambil langsung dari counter database setiap kali ada kunjungan / klik join.
            </p>
          </div>
        </div>

        {dailyStats.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-mono text-xs">
            Belum ada rekaman statistik trafik.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/15 text-gray-400 uppercase">
                  <th className="py-3 px-4 font-bold">Tanggal</th>
                  <th className="py-3 px-4 font-bold text-center">Pengunjung Web</th>
                  <th className="py-3 px-4 font-bold text-center">Klik Join WhatsApp</th>
                  <th className="py-3 px-4 font-bold text-center">Tingkat Konversi</th>
                  <th className="py-3 px-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-gray-200">
                {dailyStats.map((stat) => {
                  const isToday = stat.dateKey === todayKey;
                  return (
                    <tr
                      key={stat.dateKey}
                      className={isToday ? "bg-[#C44341]/10 font-bold" : "hover:bg-white/5"}
                    >
                      <td className="py-3.5 px-4 text-white">
                        <div className="flex items-center gap-2">
                          {isToday && (
                            <span className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />
                          )}
                          <span>{stat.formattedDate}</span>
                          {isToday && (
                            <span className="text-[10px] bg-[#C44341] text-white px-1.5 py-0.5 rounded font-mono uppercase">
                              Hari Ini
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-white font-bold">
                        {stat.visitors}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#C44341] font-bold">
                        {stat.joins}
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">
                        {stat.conversionRate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            isToday
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          {isToday ? "Aktif Berjalan" : "Terekam"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

