"use client";

import React, { useState, useEffect } from "react";
import {
  WeekendDayWeather,
  CyclingConditionStatus,
} from "@/types/weather";
import {
  getWeatherMeta,
  getOfflineWeatherFallback,
} from "@/lib/weatherService";

export default function BekasiWeatherWidget() {
  const [weekendData, setWeekendData] = useState<WeekendDayWeather[]>([]);
  const [activeDayTab, setActiveDayTab] = useState<number>(() => {
    const day = new Date().getDay();
    if (day === 5) return 0; // Jumat
    if (day === 6) return 1; // Sabtu
    if (day === 0) return 2; // Minggu
    return 0; // Default Jumat
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeekendWeatherAndAirQuality = async () => {
    setIsLoading(true);
    try {
      const cached = sessionStorage.getItem("tibatiba_bekasi_weather_v6");
      const cachedTime = sessionStorage.getItem("tibatiba_bekasi_weather_time_v6");

      if (cached && cachedTime && Date.now() - parseInt(cachedTime, 10) < 30 * 60 * 1000) {
        setWeekendData(JSON.parse(cached));
        setIsLoading(false);
        return;
      }

      // Fetch dari server-side Route Handler yang sudah ter-cache ISR 30 menit
      const res = await fetch("/api/weather");
      if (!res.ok) {
        throw new Error(`Weather API error status: ${res.status}`);
      }

      const data: WeekendDayWeather[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setWeekendData(data);
        sessionStorage.setItem("tibatiba_bekasi_weather_v6", JSON.stringify(data));
        sessionStorage.setItem("tibatiba_bekasi_weather_time_v6", Date.now().toString());
      } else {
        throw new Error("Invalid weather data format");
      }
    } catch (err) {
      console.warn("Gagal mengambil prakiraan cuaca, menggunakan data offline:", err);
      setWeekendData(getOfflineWeatherFallback());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekendWeatherAndAirQuality();
  }, []);

  const activeWeekend = weekendData[activeDayTab] || weekendData[0];

  const renderWeatherIcon = (code: number, sizeClass = "w-5 h-5") => {
    const meta = getWeatherMeta(code);
    if (meta.icon === "sun") {
      return (
        <svg className={`${sizeClass} text-[#FFAE00]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" strokeWidth="2" fill="#FFAE00" fillOpacity="0.3" />
          <path strokeLinecap="round" strokeWidth="2" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    }
    if (meta.icon === "rain") {
      return (
        <svg className={`${sizeClass} text-[#4A90E2]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
          <path strokeLinecap="round" strokeWidth={2} d="M8 21l2-4m4 4l2-4" />
        </svg>
      );
    }
    if (meta.icon === "storm") {
      return (
        <svg className={`${sizeClass} text-[#E02020]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className={`${sizeClass} text-[#EAE6DD]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    );
  };

  const getStatusBadge = (status: CyclingConditionStatus) => {
    if (status === "ideal") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ideal Gowes
        </span>
      );
    }
    if (status === "caution") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Perhatian
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Waspada Hujan
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-black/45 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl overflow-hidden animate-pulse">
        {/* Top Header Skeleton */}
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#C44341]/20 border border-[#C44341]/40 text-[#C44341] shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Prakiraan Cuaca & Kualitas Udara
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#EAE6DD] font-semibold">
                  Jumat Malam & Akhir Pekan
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />
                <span className="text-[11px] text-[#868B96]">
                  Mengambil data cuaca & indeks kualitas udara...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cards Skeleton */}
        <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-black/30 p-3.5 rounded-xl border border-white/10 space-y-3">
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-8 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activeWeekend) return null;

  return (
    <div className="bg-black/45 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl overflow-hidden">
      {/* Top Main Header */}
      <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/15 bg-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#C44341]/20 border border-[#C44341]/40 text-[#C44341] shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-display)" }}>
                Prakiraan Cuaca & Kualitas Udara
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#EAE6DD] font-semibold">
                Bekasi & Sekitarnya
              </span>
            </div>
            <p className="text-[11px] text-[#868B96] mt-0.5">
              Pantauan otomatis Open-Meteo & AQI untuk persiapan gowes akhir pekan
            </p>
          </div>
        </div>

        {/* 3 Day Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/15 self-start md:self-auto overflow-x-auto max-w-full">
          {weekendData.map((day, idx) => {
            const isActive = activeDayTab === idx;
            const tabShort = idx === 0 ? "Jumat" : idx === 1 ? "Sabtu" : "Minggu";
            const sessionSub = idx === 0 ? "Malam" : "Pagi";

            return (
              <button
                key={day.dayLabel}
                onClick={() => setActiveDayTab(idx)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#C44341] text-white shadow-md shadow-[#C44341]/30 font-semibold"
                    : "text-[#868B96] hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{tabShort}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${isActive ? "bg-black/30 text-white" : "bg-white/10 text-gray-400"}`}>
                  {sessionSub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Banner & Readiness Recommendation */}
      <div className="px-3.5 sm:px-4 py-2.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white font-mono uppercase tracking-wide">
            {activeWeekend.dayLabel} ({activeWeekend.dateFormatted})
          </span>
          {getStatusBadge(activeWeekend.overallStatus)}
        </div>
        <div className="text-[#EAE6DD] flex items-center gap-1.5 text-[11px] sm:text-xs font-medium">
          <span>🚴‍♂️</span>
          <span>{activeWeekend.overallRecommendation}</span>
        </div>
      </div>

      {/* 4-Region Grid: Clean, Compact, Apple-Weather Style Cards */}
      <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {activeWeekend.regions.map((region) => (
          <div
            key={region.regionName}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 hover:border-[#C44341] transition-all flex flex-col justify-between group space-y-3"
          >
            {/* Header: Region Name & Weather Icon */}
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight group-hover:text-[#C44341] transition-colors">
                  📍 {region.regionName}
                </span>
                {renderWeatherIcon(region.weatherCode, "w-5 h-5 sm:w-6 sm:h-6")}
              </div>
              <span className="text-[10px] text-[#868B96] block truncate mt-0.5 font-mono">
                {region.landmark}
              </span>
            </div>

            {/* Weather Metrics */}
            <div className="pt-2 border-t border-white/10 flex items-end justify-between">
              <div>
                <span className="text-xl sm:text-2xl font-black text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  {region.temp}°C
                </span>
                <span className="text-[10px] text-[#868B96] block mt-1 font-medium">
                  {region.weatherDescription}
                </span>
              </div>

              <div className="text-right">
                <span className="text-base sm:text-lg block leading-none mb-0.5">
                  {region.rainProb >= 50 ? "🌧️" : region.rainProb >= 25 ? "💧" : "🌤️"}
                </span>
                <span className="text-[10px] font-mono text-[#868B96] block font-medium">
                  💨 {region.windSpeed} km/h
                </span>
              </div>
            </div>

            {/* Air Quality (AQI) Section */}
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <span>🍃</span>
                  <span>Kualitas Udara</span>
                </span>
                <span className="text-white font-bold tracking-tight">AQI {region.airQuality.aqi}</span>
              </div>
              <div
                className={`w-full py-1 px-2 rounded-md text-center font-bold text-[10px] tracking-tight border ${region.airQuality.badgeBg}`}
              >
                {region.airQuality.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
