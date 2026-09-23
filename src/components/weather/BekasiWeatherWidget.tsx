"use client";

import React, { useState, useEffect } from "react";
import {
  WeekendDayWeather,
  OpenMeteoLocationResponse,
  OpenMeteoAirQualityResponse,
  CyclingConditionStatus,
  AirQualityInfo,
} from "@/types/weather";

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

function evaluateCycling(maxRain: number, maxCode: number, avgAqi: number): { status: CyclingConditionStatus; rec: string } {
  if (maxCode >= 95 || maxRain >= 50) {
    return {
      status: "warning",
      rec: "Waspada potensi hujan deras / aspal licin — Disarankan tunda atau gowes indoor",
    };
  }
  if (maxRain >= 25 || maxCode >= 51) {
    return {
      status: "caution",
      rec: "Bisa gowes santai — Siapkan pelindung hujan & jaga jarak pengereman",
    };
  }
  if (avgAqi > 150) {
    return {
      status: "caution",
      rec: "Cuaca cerah, namun udara pagi agak berdebu — Disarankan gunakan buff / masker",
    };
  }
  return {
    status: "ideal",
    rec: "Kondisi cuaca & udara pagi sangat bagus untuk gowes bersama di Bekasi",
  };
}

function evaluateAirQuality(aqi: number, pm2_5: number): AirQualityInfo {
  if (aqi <= 50) {
    return {
      aqi,
      pm2_5,
      level: "good",
      label: "Bagus",
      colorClass: "text-emerald-400",
      badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      recommendation: "Udara bersih",
    };
  }
  if (aqi <= 100) {
    return {
      aqi,
      pm2_5,
      level: "moderate",
      label: "Sedang",
      colorClass: "text-yellow-400",
      badgeBg: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
      recommendation: "Cukup nyaman",
    };
  }
  if (aqi <= 150) {
    return {
      aqi,
      pm2_5,
      level: "sensitive",
      label: "Kurang Bagus",
      colorClass: "text-amber-400",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      recommendation: "Gunakan buff/masker",
    };
  }
  if (aqi <= 200) {
    return {
      aqi,
      pm2_5,
      level: "unhealthy",
      label: "Tidak Bagus",
      colorClass: "text-orange-400",
      badgeBg: "bg-orange-500/15 text-orange-300 border-orange-500/30",
      recommendation: "Gunakan masker",
    };
  }
  return {
    aqi,
    pm2_5,
    level: "very-unhealthy",
    label: "Sangat Tidak Bagus",
    colorClass: "text-red-400",
    badgeBg: "bg-red-500/15 text-red-300 border-red-500/30",
    recommendation: "Hindari jalan padat",
  };
}

export default function BekasiWeatherWidget() {
  const [weekendData, setWeekendData] = useState<WeekendDayWeather[]>([]);
  const [activeDayTab, setActiveDayTab] = useState<0 | 1>(0); // 0 = Sabtu, 1 = Minggu
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeekendWeatherAndAirQuality = async () => {
    setIsLoading(true);
    try {
      const cached = sessionStorage.getItem("tibatiba_bekasi_weather_v4");
      const cachedTime = sessionStorage.getItem("tibatiba_bekasi_weather_time_v4");

      if (cached && cachedTime && Date.now() - parseInt(cachedTime, 10) < 30 * 60 * 1000) {
        setWeekendData(JSON.parse(cached));
        setIsLoading(false);
        return;
      }

      const lats = BEKASI_REGIONS.map((r) => r.lat).join(",");
      const lons = BEKASI_REGIONS.map((r) => r.lon).join(",");

      // 1. Weather Forecast URL
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=Asia%2FJakarta&forecast_days=7`;

      // 2. Air Quality URL
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&hourly=us_aqi,pm2_5&timezone=Asia%2FJakarta&forecast_days=7`;

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(weatherUrl).then((r) => r.json()).catch(() => null),
        fetch(aqiUrl).then((r) => r.json()).catch(() => null),
      ]);

      const weatherResponses: OpenMeteoLocationResponse[] = Array.isArray(weatherRes) ? weatherRes : weatherRes ? [weatherRes] : [];
      const aqiResponses: OpenMeteoAirQualityResponse[] = Array.isArray(aqiRes) ? aqiRes : aqiRes ? [aqiRes] : [];

      // Find upcoming Saturday & Sunday dates
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat

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
        { label: "Sabtu Gowes" as const, dateStr: satDateStr, dObj: satDate },
        { label: "Minggu Gowes" as const, dateStr: sunDateStr, dObj: sunDate },
      ];

      const processedWeekend: WeekendDayWeather[] = weekendTargetDays.map((target) => {
        const dateFormatted = target.dObj.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        let highestRain = 0;
        let highestCode = 0;
        let totalAqi = 0;

        const regions = BEKASI_REGIONS.map((region, rIdx) => {
          const locData = weatherResponses[rIdx] || weatherResponses[0];
          const aqiData = aqiResponses[rIdx] || aqiResponses[0];

          // Ambil index waktu yang tepat pada pagi hari 05:00 - 08:00 WIB
          const timeArray: string[] = locData?.hourly?.time || [];
          const morningIndices: number[] = [];

          timeArray.forEach((t, idx) => {
            if (t.startsWith(target.dateStr)) {
              if (t.endsWith("05:00") || t.endsWith("06:00") || t.endsWith("07:00") || t.endsWith("08:00")) {
                morningIndices.push(idx);
              }
            }
          });

          // Fallback jika tidak ditemukan index persis
          const fallbackIndices = [6, 7, 8];
          const indicesToUse = morningIndices.length > 0 ? morningIndices : fallbackIndices;

          const temps = indicesToUse.map((i) => locData?.hourly?.temperature_2m?.[i] ?? 26);
          const rains = indicesToUse.map((i) => locData?.hourly?.precipitation_probability?.[i] ?? 0);
          const winds = indicesToUse.map((i) => locData?.hourly?.wind_speed_10m?.[i] ?? 8);
          const codes = indicesToUse.map((i) => locData?.hourly?.weather_code?.[i] ?? 1);

          const temp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
          const rainProb = Math.max(...rains);
          const wind = Math.round(winds.reduce((a, b) => a + b, 0) / winds.length);
          const code = codes[0] || 1;
          const { desc } = getWeatherMeta(code);

          // AQI & PM2.5 calculation
          const aqiTimeArray: string[] = aqiData?.hourly?.time || [];
          const aqiIndices: number[] = [];
          aqiTimeArray.forEach((t, idx) => {
            if (t.startsWith(target.dateStr)) {
              if (t.endsWith("05:00") || t.endsWith("06:00") || t.endsWith("07:00") || t.endsWith("08:00")) {
                aqiIndices.push(idx);
              }
            }
          });

          const aqiIndicesToUse = aqiIndices.length > 0 ? aqiIndices : indicesToUse;
          const aqis = aqiIndicesToUse.map((i) => aqiData?.hourly?.us_aqi?.[i] ?? 65);
          const pm25s = aqiIndicesToUse.map((i) => aqiData?.hourly?.pm2_5?.[i] ?? 20);

          const validAqis = aqis.filter((v) => typeof v === "number" && !isNaN(v));
          const validPm25s = pm25s.filter((v) => typeof v === "number" && !isNaN(v));

          const avgAqi = validAqis.length > 0 ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length) : 65;
          const avgPm25 = validPm25s.length > 0 ? Math.round(validPm25s.reduce((a, b) => a + b, 0) / validPm25s.length) : 20;

          totalAqi += avgAqi;
          if (rainProb > highestRain) highestRain = rainProb;
          if (code > highestCode) highestCode = code;

          const airQuality = evaluateAirQuality(avgAqi, avgPm25);

          return {
            regionName: region.name,
            landmark: region.landmark,
            temp,
            rainProb,
            weatherCode: code,
            weatherDescription: desc,
            windSpeed: wind,
            airQuality,
          };
        });

        const avgWeekendAqi = Math.round(totalAqi / regions.length);
        const { status, rec } = evaluateCycling(highestRain, highestCode, avgWeekendAqi);
        const overallAqi = evaluateAirQuality(avgWeekendAqi, 20);

        return {
          dayLabel: target.label,
          dateFormatted,
          dateStr: target.dateStr,
          overallStatus: status,
          overallRecommendation: rec,
          overallAqiLevel: overallAqi.level,
          overallAqiLabel: overallAqi.label,
          regions,
        };
      });

      setWeekendData(processedWeekend);
      sessionStorage.setItem("tibatiba_bekasi_weather_clean_v3", JSON.stringify(processedWeekend));
      sessionStorage.setItem("tibatiba_bekasi_weather_clean_time_v3", Date.now().toString());
    } catch {
      // Clean fallback offline data
      const defaultAqi = evaluateAirQuality(65, 20);
      const fallback: WeekendDayWeather[] = [
        {
          dayLabel: "Sabtu Gowes",
          dateFormatted: "Akhir Pekan",
          dateStr: "sat",
          overallStatus: "ideal",
          overallRecommendation: "Kondisi cuaca & udara pagi sangat bagus untuk gowes bersama di Bekasi",
          overallAqiLevel: "moderate",
          overallAqiLabel: "Sedang",
          regions: [
            { regionName: "Bekasi Timur", landmark: "Tol Timur • Bulak Kapal", temp: 25, rainProb: 0, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 7, airQuality: defaultAqi },
            { regionName: "Bekasi Barat", landmark: "MM • Kranji • Patriot", temp: 25, rainProb: 0, weatherCode: 0, weatherDescription: "Cerah", windSpeed: 8, airQuality: defaultAqi },
            { regionName: "Bekasi Selatan", landmark: "Grand Galaxy • Pekayon", temp: 25, rainProb: 5, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 7, airQuality: defaultAqi },
            { regionName: "Bekasi Utara", landmark: "Summarecon • Harapan Indah", temp: 26, rainProb: 0, weatherCode: 0, weatherDescription: "Cerah", windSpeed: 9, airQuality: defaultAqi },
          ],
        },
        {
          dayLabel: "Minggu Gowes",
          dateFormatted: "Akhir Pekan",
          dateStr: "sun",
          overallStatus: "ideal",
          overallRecommendation: "Kondisi cuaca & udara pagi sangat bagus untuk gowes bersama di Bekasi",
          overallAqiLevel: "moderate",
          overallAqiLabel: "Sedang",
          regions: [
            { regionName: "Bekasi Timur", landmark: "Tol Timur • Bulak Kapal", temp: 25, rainProb: 10, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 8, airQuality: defaultAqi },
            { regionName: "Bekasi Barat", landmark: "MM • Kranji • Patriot", temp: 25, rainProb: 5, weatherCode: 1, weatherDescription: "Cerah Berawan", windSpeed: 8, airQuality: defaultAqi },
            { regionName: "Bekasi Selatan", landmark: "Grand Galaxy • Pekayon", temp: 25, rainProb: 10, weatherCode: 2, weatherDescription: "Cerah Berawan", windSpeed: 7, airQuality: defaultAqi },
            { regionName: "Bekasi Utara", landmark: "Summarecon • Harapan Indah", temp: 26, rainProb: 5, weatherCode: 0, weatherDescription: "Cerah", windSpeed: 9, airQuality: defaultAqi },
          ],
        },
      ];
      setWeekendData(fallback);
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
                  Pagi 05:30 – 08:30 WIB
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-black/50 p-1 rounded-md border border-white/15">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs bg-[#C44341]/40 text-white/50 font-mono">
                Sabtu
              </div>
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs text-[#868B96]/50 font-mono">
                Minggu
              </div>
            </div>
          </div>
        </div>

        {/* 4-Region Grid Skeleton */}
        <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {BEKASI_REGIONS.map((region) => (
            <div
              key={region.name}
              className="bg-black/50 backdrop-blur-xs p-3 rounded-lg border border-white/15 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="h-4 w-24 bg-white/20 rounded" />
                <div className="h-2.5 w-32 bg-white/10 rounded mt-1.5" />
              </div>
              <div className="h-8 bg-white/10 rounded" />
              <div className="h-6 bg-white/10 rounded" />
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
                Prakiraan Cuaca & Kualitas Udara
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#EAE6DD] font-semibold">
                Pagi 05:30 – 08:30 WIB
              </span>
            </div>
            <p className="text-[11px] text-[#868B96] mt-0.5">
              Wilayah Bekasi (Timur • Barat • Selatan • Utara)
            </p>
          </div>
        </div>

        {/* Right: Sabtu / Minggu Switcher & Refresh Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-black/50 p-1 rounded-md border border-white/15">
            <button
              type="button"
              onClick={() => setActiveDayTab(0)}
              className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all font-mono ${
                activeDayTab === 0
                  ? "bg-[#C44341] text-white shadow-xs"
                  : "text-[#868B96] hover:text-white hover:bg-white/5"
              }`}
            >
              Sabtu
            </button>
            <button
              type="button"
              onClick={() => setActiveDayTab(1)}
              className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all font-mono ${
                activeDayTab === 1
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
              sessionStorage.removeItem("tibatiba_bekasi_weather_v4");
              sessionStorage.removeItem("tibatiba_bekasi_weather_time_v4");
              fetchWeekendWeatherAndAirQuality();
            }}
            title="Perbarui data cuaca & kualitas udara"
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

            {/* Air Quality (AQI) Section: 2 Clean Rows */}
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
