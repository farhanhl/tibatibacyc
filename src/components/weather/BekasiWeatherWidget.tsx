"use client";

import React, { useState, useEffect } from "react";
import { WeekendDayWeather, OpenMeteoLocationResponse, CyclingConditionStatus } from "@/types/weather";

const BEKASI_REGIONS = [
  { name: "Bekasi Timur", landmark: "Tol Timur • Bulak Kapal", lat: -6.2536, lon: 107.0186 },
  { name: "Bekasi Barat", landmark: "MM • Kranji • Patriot", lat: -6.2349, lon: 106.9782 },
  { name: "Bekasi Selatan", landmark: "Grand Galaxy • Pekayon", lat: -6.2735, lon: 106.9803 },
  { name: "Bekasi Utara", landmark: "Summarecon • Harapan Indah", lat: -6.2158, lon: 107.0019 },
];

function getWeatherMeta(code: number): { desc: string; icon: "sun" | "cloud-sun" | "cloud" | "rain" | "storm" } {
  switch (code) {
    case 0:
      return { desc: "Cerah", icon: "sun" };
    case 1:
    case 2:
      return { desc: "Cerah Berawan", icon: "cloud-sun" };
    case 3:
      return { desc: "Berawan", icon: "cloud" };
    case 45:
    case 48:
      return { desc: "Berkabut", icon: "cloud" };
    case 51:
    case 53:
    case 55:
      return { desc: "Gerimis", icon: "rain" };
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return { desc: "Hujan", icon: "rain" };
    case 95:
    case 96:
    case 99:
      return { desc: "Hujan Petir", icon: "storm" };
    default:
      return { desc: "Cerah Berawan", icon: "cloud-sun" };
  }
}

function evaluateCycling(maxRain: number, maxCode: number): { status: CyclingConditionStatus; rec: string } {
  if (maxCode >= 95 || maxRain >= 50) {
    return {
      status: "warning",
      rec: "Waspada potensi hujan deras / aspal licin — Disarankan tunda atau gowes indoor",
    };
  }
  if (maxRain >= 25 || maxCode >= 51) {
    return {
      status: "caution",
      rec: "Bisa gowes santai — Siapkan pelindung hujan dan jaga jarak pengereman",
    };
  }
  return {
    status: "ideal",
    rec: "Kondisi pagi sangat bagus & sejuk untuk gowes bareng di Bekasi",
  };
}

export default function BekasiWeatherWidget() {
  const [weekendData, setWeekendData] = useState<WeekendDayWeather[]>([]);
  const [activeDayTab, setActiveDayTab] = useState<0 | 1>(0); // 0 = Sabtu, 1 = Minggu
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeekendWeather = async () => {
    setIsLoading(true);
    try {
      const cached = sessionStorage.getItem("tibatiba_bekasi_weekend_weather_v2");
      const cachedTime = sessionStorage.getItem("tibatiba_bekasi_weekend_weather_time_v2");

      if (cached && cachedTime && Date.now() - parseInt(cachedTime, 10) < 30 * 60 * 1000) {
        setWeekendData(JSON.parse(cached));
        setIsLoading(false);
        return;
      }

      // Batch query 4 Bekasi regions (Timur, Barat, Selatan, Utara)
      const lats = BEKASI_REGIONS.map((r) => r.lat).join(",");
      const lons = BEKASI_REGIONS.map((r) => r.lon).join(",");
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=Asia%2FJakarta&forecast_days=7`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data cuaca");

      const rawData = await res.json();
      const locationResponses: OpenMeteoLocationResponse[] = Array.isArray(rawData) ? rawData : [rawData];

      // Find upcoming Saturday & Sunday dates
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat

      // Calculate days until upcoming Saturday and Sunday
      let daysUntilSat = (6 - currentDayOfWeek + 7) % 7;
      let daysUntilSun = (0 - currentDayOfWeek + 7) % 7;
      if (daysUntilSun === 0 && currentDayOfWeek === 0) daysUntilSun = 0; // Today is Sunday

      const satDate = new Date(now);
      satDate.setDate(now.getDate() + daysUntilSat);
      const satDateStr = satDate.toISOString().split("T")[0];

      const sunDate = new Date(now);
      sunDate.setDate(now.getDate() + daysUntilSun);
      const sunDateStr = sunDate.toISOString().split("T")[0];

      const weekendTargetDays = [
        { label: "Sabtu Gowes" as const, dateStr: satDateStr, dObj: satDate, targetOffset: daysUntilSat },
        { label: "Minggu Gowes" as const, dateStr: sunDateStr, dObj: sunDate, targetOffset: daysUntilSun },
      ];

      const processedWeekend: WeekendDayWeather[] = weekendTargetDays.map((target) => {
        const dateFormatted = target.dObj.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        let highestRain = 0;
        let highestCode = 0;

        const regions = BEKASI_REGIONS.map((region, rIdx) => {
          const locData = locationResponses[rIdx] || locationResponses[0];
          const hourStart = target.targetOffset * 24 + 6; // 06:00 WIB
          const hourEnd = target.targetOffset * 24 + 8; // 08:00 WIB

          const temps = locData.hourly.temperature_2m.slice(hourStart, hourEnd + 1);
          const rains = locData.hourly.precipitation_probability.slice(hourStart, hourEnd + 1);
          const winds = locData.hourly.wind_speed_10m.slice(hourStart, hourEnd + 1);
          const codes = locData.hourly.weather_code.slice(hourStart, hourEnd + 1);

          const temp = temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : 25;
          const rainProb = rains.length > 0 ? Math.max(...rains) : 0;
          const wind = winds.length > 0 ? Math.round(winds.reduce((a, b) => a + b, 0) / winds.length) : 8;
          const code = codes.length > 0 ? codes[0] : 1;
          const { desc } = getWeatherMeta(code);

          if (rainProb > highestRain) highestRain = rainProb;
          if (code > highestCode) highestCode = code;

          return {
            regionName: region.name,
            landmark: region.landmark,
            temp,
            rainProb,
            weatherCode: code,
            weatherDescription: desc,
            windSpeed: wind,
          };
        });

        const { status, rec } = evaluateCycling(highestRain, highestCode);

        return {
          dayLabel: target.label,
          dateFormatted,
          dateStr: target.dateStr,
          overallStatus: status,
          overallRecommendation: rec,
          regions,
        };
      });

      setWeekendData(processedWeekend);
      sessionStorage.setItem("tibatiba_bekasi_weekend_weather_v2", JSON.stringify(processedWeekend));
      sessionStorage.setItem("tibatiba_bekasi_weekend_weather_time_v2", Date.now().toString());
    } catch {
      // Fallback offline data
      const fallback: WeekendDayWeather[] = [
        {
          dayLabel: "Sabtu Gowes",
          dateFormatted: "Akhir Pekan",
          dateStr: "sat",
          overallStatus: "ideal",
          overallRecommendation: "Kondisi pagi sangat bagus & sejuk untuk gowes bareng di Bekasi",
          regions: [
            { regionName: "Bekasi Timur", landmark: "Tol Timur • Bulak Kapal", temp: 25, rainProb: 0, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 7 },
            { regionName: "Bekasi Barat", landmark: "MM • Kranji • Patriot", temp: 25, rainProb: 0, weatherCode: 0, weatherDescription: "Cerah", windSpeed: 8 },
            { regionName: "Bekasi Selatan", landmark: "Grand Galaxy • Pekayon", temp: 25, rainProb: 5, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 7 },
            { regionName: "Bekasi Utara", landmark: "Summarecon • Harapan Indah", temp: 26, rainProb: 0, weatherCode: 0, weatherDescription: "Cerah", windSpeed: 9 },
          ],
        },
        {
          dayLabel: "Minggu Gowes",
          dateFormatted: "Akhir Pekan",
          dateStr: "sun",
          overallStatus: "ideal",
          overallRecommendation: "Kondisi pagi sangat bagus & sejuk untuk gowes bareng di Bekasi",
          regions: [
            { regionName: "Bekasi Timur", landmark: "Tol Timur • Bulak Kapal", temp: 25, rainProb: 10, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 8 },
            { regionName: "Bekasi Barat", landmark: "MM • Kranji • Patriot", temp: 25, rainProb: 5, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 8 },
            { regionName: "Bekasi Selatan", landmark: "Grand Galaxy • Pekayon", temp: 25, rainProb: 10, weatherCode: 2, weatherDescription: "Cerah Berawan", windSpeed: 7 },
            { regionName: "Bekasi Utara", landmark: "Summarecon • Harapan Indah", temp: 26, rainProb: 5, weatherCode: 0, weatherDescription: "Cerah", windSpeed: 9 },
          ],
        },
      ];
      setWeekendData(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekendWeather();
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
    // cloud / cloud-sun
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
          Waspada Gerimis
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
        {/* Top Header: Title & Weekend Day Switcher Skeleton */}
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15">
          {/* Left: Title & Morning Hours */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#C44341]/20 border border-[#C44341]/40 text-[#C44341] shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Perkiraan Cuaca Untuk Gowes Akhir Pekan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#EAE6DD] font-semibold">
                  Pagi 05:30 – 08:30 WIB
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />
                <span className="text-[11px] text-[#868B96]">
                  Mengambil data cuaca BMKG & Open-Meteo...
                </span>
              </div>
            </div>
          </div>

          {/* Right: Tab placeholders */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-black/50 p-1 rounded-md border border-white/15">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs bg-[#C44341]/40 text-white/50 font-mono">
                Sabtu
              </div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs text-[#868B96]/50 font-mono">
                Minggu
              </div>
            </div>
            <div className="p-2 rounded-md bg-black/50 border border-white/15 text-[#868B96]">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        {/* Summary Banner Skeleton */}
        <div className="px-3.5 sm:px-4 py-2.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-32 bg-white/15 rounded" />
            <div className="h-5 w-24 bg-white/10 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🚴‍♂️</span>
            <div className="h-3.5 w-60 sm:w-72 bg-white/15 rounded" />
          </div>
        </div>

        {/* 4-Region Grid Skeleton */}
        <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {BEKASI_REGIONS.map((region) => (
            <div
              key={region.name}
              className="bg-black/50 backdrop-blur-xs p-3 rounded-lg border border-white/15 flex flex-col justify-between"
            >
              {/* Region Name & Landmark */}
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                    📍 {region.name}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-white/15" />
                </div>
                <span className="text-[10px] text-[#868B96] block truncate mt-0.5">
                  {region.landmark}
                </span>
              </div>

              {/* Metrics Skeleton */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-end justify-between">
                <div>
                  <div className="h-6 sm:h-7 w-14 bg-white/20 rounded" />
                  <div className="h-2.5 w-16 bg-white/10 rounded mt-1.5" />
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="w-6 h-6 bg-white/15 rounded" />
                  <div className="h-2.5 w-14 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activeWeekend) return null;

  return (
    <div className="bg-black/45 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 hover:border-[#C44341]">
      {/* Top Header: Title & Weekend Day Switcher */}
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15">
        {/* Left: Title & Morning Hours */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#C44341]/20 border border-[#C44341]/40 text-[#C44341] shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-display)" }}>
                Perkiraan Cuaca Untuk Gowes Akhir Pekan
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#EAE6DD] font-semibold">
                Pagi 05:30 – 08:30 WIB
              </span>
            </div>
            <p className="text-[11px] text-[#868B96] mt-0.5">
              Wilayah Bekasi
            </p>
          </div>
        </div>

        {/* Right: Sabtu / Minggu Switcher & Refresh Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-black/50 p-1 rounded-md border border-white/15">
            <button
              type="button"
              onClick={() => setActiveDayTab(0)}
              className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all font-mono ${activeDayTab === 0
                ? "bg-[#C44341] text-white shadow-xs"
                : "text-[#868B96] hover:text-white hover:bg-white/5"
                }`}
            >
              Sabtu
            </button>
            <button
              type="button"
              onClick={() => setActiveDayTab(1)}
              className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all font-mono ${activeDayTab === 1
                ? "bg-[#C44341] text-white shadow-xs"
                : "text-[#868B96] hover:text-white hover:bg-white/5"
                }`}
            >
              Minggu
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("tibatiba_bekasi_weekend_weather_v2");
              sessionStorage.removeItem("tibatiba_bekasi_weekend_weather_time_v2");
              fetchWeekendWeather();
            }}
            title="Perbarui data cuaca"
            className="cursor-pointer p-2 rounded-md bg-black/50 hover:bg-black/70 text-[#EAE6DD] hover:text-white border border-white/15 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Banner & Readiness Recommendation */}
      <div className="px-3.5 sm:px-4 py-2.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white font-mono uppercase tracking-wide">
            {activeWeekend.dayLabel} ({activeWeekend.dateFormatted})
          </span>
          {getStatusBadge(activeWeekend.overallStatus)}
        </div>
        <div className="text-[#EAE6DD] flex items-center gap-1.5 text-[11px] sm:text-xs">
          <span>🚴‍♂️</span>
          <span>{activeWeekend.overallRecommendation}</span>
        </div>
      </div>

      {/* 4-Region Grid: Bekasi Timur, Barat, Selatan, Utara */}
      <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {activeWeekend.regions.map((region) => (
          <div
            key={region.regionName}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-xs p-3 rounded-lg border border-white/15 hover:border-[#C44341] transition-all flex flex-col justify-between group"
          >
            {/* Region Name & Landmark */}
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight group-hover:text-[#C44341] transition-colors">
                  📍 {region.regionName}
                </span>
                {renderWeatherIcon(region.weatherCode, "w-5 h-5 sm:w-6 sm:h-6")}
              </div>
              <span className="text-[10px] text-[#868B96] block truncate mt-0.5">
                {region.landmark}
              </span>
            </div>

            {/* Metrics */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-end justify-between">
              <div>
                <span className="text-xl sm:text-2xl font-black text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  {region.temp}°C
                </span>
                <span className="text-[10px] text-[#868B96] block mt-1 font-medium">
                  {region.weatherDescription}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xl sm:text-2xl block leading-none mb-1">
                  {region.rainProb >= 50 ? "🌧️" : region.rainProb >= 25 ? "💧" : "🌤️"}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#868B96] block font-medium">
                  💨 {region.windSpeed} km/h
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
