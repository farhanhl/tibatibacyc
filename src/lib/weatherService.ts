import {
  WeekendDayWeather,
  OpenMeteoLocationResponse,
  OpenMeteoAirQualityResponse,
  CyclingConditionStatus,
  AirQualityInfo,
} from "@/types/weather";

export const BEKASI_REGIONS = [
  { name: "Bekasi Timur", landmark: "Tol Timur • Bulak Kapal", lat: -6.2536, lon: 107.0186 },
  { name: "Bekasi Barat", landmark: "MM • Kranji • Patriot", lat: -6.2349, lon: 106.9782 },
  { name: "Bekasi Selatan", landmark: "Grand Galaxy • Pekayon", lat: -6.2735, lon: 106.9803 },
  { name: "Bekasi Utara", landmark: "Summarecon • Harapan Indah", lat: -6.2158, lon: 107.0019 },
];

export function getWeatherMeta(code: number): {
  desc: string;
  icon: "sun" | "cloud-sun" | "cloud" | "rain" | "storm";
} {
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

export function evaluateCycling(
  maxRain: number,
  maxCode: number,
  avgAqi: number,
  isNight = false
): { status: CyclingConditionStatus; rec: string } {
  if (maxCode >= 95 || maxRain >= 50) {
    return {
      status: "warning",
      rec: isNight
        ? "Waspada potensi hujan deras & jalanan malam licin — Disarankan tunda night ride atau gowes indoor"
        : "Waspada potensi hujan deras / aspal licin — Disarankan tunda atau gowes indoor",
    };
  }
  if (maxRain >= 25 || maxCode >= 51) {
    return {
      status: "caution",
      rec: isNight
        ? "Bisa gowes malam santai — Pasang lampu sepeda terang, siapkan jas hujan & jaga jarak pengereman"
        : "Bisa gowes santai — Siapkan pelindung hujan & jaga jarak pengereman",
    };
  }
  if (avgAqi > 150) {
    return {
      status: "caution",
      rec: isNight
        ? "Cuaca cerah, namun udara malam agak berdebu — Disarankan gunakan masker / buff & kacamata bening"
        : "Cuaca cerah, namun udara pagi agak berdebu — Disarankan gunakan buff / masker",
    };
  }
  return {
    status: "ideal",
    rec: isNight
      ? "Kondisi cuaca malam cerah & sejuk, sangat aman untuk gowes malam (Night Ride) keliling Bekasi"
      : "Kondisi cuaca & udara pagi sangat bagus untuk gowes bersama di Bekasi",
  };
}

export function evaluateAirQuality(aqi: number, pm2_5: number): AirQualityInfo {
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

/**
 * Menghitung tanggal akhir pekan (Jumat, Sabtu, Minggu) dalam satu siklus yang koheren
 * berdasarkan waktu lokal Asia/Jakarta.
 */
export function getCoherentWeekendTargetDays() {
  const now = new Date();
  const jakartaDateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = jakartaDateFormatter.formatToParts(now);
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value || "";
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const currentDayOfWeek = dayMap[weekdayStr] ?? now.getDay();

  // Tentukan offset hari relatif terhadap hari Jumat siklus weekend ini
  let fridayOffset = 0;
  if (currentDayOfWeek >= 1 && currentDayOfWeek <= 4) {
    // Senin - Kamis: Arahkan ke Jumat mendatang
    fridayOffset = 5 - currentDayOfWeek;
  } else if (currentDayOfWeek === 5) {
    // Jumat: Hari ini adalah Jumat
    fridayOffset = 0;
  } else if (currentDayOfWeek === 6) {
    // Sabtu: Kemarin adalah Jumat
    fridayOffset = -1;
  } else if (currentDayOfWeek === 0) {
    // Minggu: Jumat adalah 2 hari yang lalu
    fridayOffset = -2;
  }

  const year = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === "day")!.value, 10);
  const baseJakartaDate = new Date(Date.UTC(year, month, day));

  const getDateObj = (offsetDays: number) => {
    const d = new Date(baseJakartaDate);
    d.setUTCDate(baseJakartaDate.getUTCDate() + offsetDays);
    return d;
  };

  const formatLocalDateStr = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dt = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  };

  const friDate = getDateObj(fridayOffset);
  const satDate = getDateObj(fridayOffset + 1);
  const sunDate = getDateObj(fridayOffset + 2);

  return [
    {
      label: "Jumat Malam" as const,
      tabLabel: "Jumat",
      timeSlotBadge: "Malam 20:00 – 22:00 WIB",
      timeSlot: "20:00 – 22:00 WIB",
      targetHours: ["20:00", "21:00", "22:00"],
      fallbackIndices: [20, 21, 22],
      isNight: true,
      dateStr: formatLocalDateStr(friDate),
      dObj: friDate,
    },
    {
      label: "Sabtu Gowes" as const,
      tabLabel: "Sabtu",
      timeSlotBadge: "Pagi 05:30 – 08:30 WIB",
      timeSlot: "05:30 – 08:30 WIB",
      targetHours: ["05:00", "06:00", "07:00", "08:00"],
      fallbackIndices: [5, 6, 7, 8],
      isNight: false,
      dateStr: formatLocalDateStr(satDate),
      dObj: satDate,
    },
    {
      label: "Minggu Gowes" as const,
      tabLabel: "Minggu",
      timeSlotBadge: "Pagi 05:30 – 08:30 WIB",
      timeSlot: "05:30 – 08:30 WIB",
      targetHours: ["05:00", "06:00", "07:00", "08:00"],
      fallbackIndices: [5, 6, 7, 8],
      isNight: false,
      dateStr: formatLocalDateStr(sunDate),
      dObj: sunDate,
    },
  ];
}

/**
 * Fetch dan olah cuaca weekend dari Open-Meteo & Air Quality API
 */
export async function fetchWeekendWeatherFromOpenMeteo(): Promise<WeekendDayWeather[]> {
  const lats = BEKASI_REGIONS.map((r) => r.lat).join(",");
  const lons = BEKASI_REGIONS.map((r) => r.lon).join(",");

  // Sertakan past_days=3 agar bila dibuka di hari Sabtu/Minggu, data Jumat tetap tersedia
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=Asia%2FJakarta&forecast_days=7&past_days=3`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&hourly=us_aqi,pm2_5&timezone=Asia%2FJakarta&forecast_days=7&past_days=3`;

  const [weatherRes, aqiRes] = await Promise.all([
    fetch(weatherUrl, { next: { revalidate: 1800 } }).then((r) => r.json()).catch(() => null),
    fetch(aqiUrl, { next: { revalidate: 1800 } }).then((r) => r.json()).catch(() => null),
  ]);

  const weatherResponses: OpenMeteoLocationResponse[] = Array.isArray(weatherRes)
    ? weatherRes
    : weatherRes
    ? [weatherRes]
    : [];
  const aqiResponses: OpenMeteoAirQualityResponse[] = Array.isArray(aqiRes)
    ? aqiRes
    : aqiRes
    ? [aqiRes]
    : [];

  const weekendTargetDays = getCoherentWeekendTargetDays();

  const processedWeekend: WeekendDayWeather[] = weekendTargetDays.map((target) => {
    const dateFormatted = target.dObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

    let highestRain = 0;
    let highestCode = 0;
    let totalAqi = 0;

    const regions = BEKASI_REGIONS.map((region, rIdx) => {
      const locData = weatherResponses[rIdx] || weatherResponses[0];
      const aqiData = aqiResponses[rIdx] || aqiResponses[0];

      const timeArray: string[] = locData?.hourly?.time || [];
      const matchedIndices: number[] = [];

      timeArray.forEach((t, idx) => {
        if (t.startsWith(target.dateStr)) {
          if (target.targetHours.some((h) => t.endsWith(h))) {
            matchedIndices.push(idx);
          }
        }
      });

      const indicesToUse = matchedIndices.length > 0 ? matchedIndices : target.fallbackIndices;

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
          if (target.targetHours.some((h) => t.endsWith(h))) {
            aqiIndices.push(idx);
          }
        }
      });

      const aqiIndicesToUse = aqiIndices.length > 0 ? aqiIndices : indicesToUse;
      const aqis = aqiIndicesToUse.map((i) => aqiData?.hourly?.us_aqi?.[i] ?? 65);
      const pm25s = aqiIndicesToUse.map((i) => aqiData?.hourly?.pm2_5?.[i] ?? 20);

      const validAqis = aqis.filter((v) => typeof v === "number" && !isNaN(v));
      const validPm25s = pm25s.filter((v) => typeof v === "number" && !isNaN(v));

      const avgAqi =
        validAqis.length > 0
          ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length)
          : 65;
      const avgPm25 =
        validPm25s.length > 0
          ? Math.round(validPm25s.reduce((a, b) => a + b, 0) / validPm25s.length)
          : 20;

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
    const { status, rec } = evaluateCycling(highestRain, highestCode, avgWeekendAqi, target.isNight);
    const overallAqi = evaluateAirQuality(avgWeekendAqi, 20);

    return {
      dayLabel: target.label,
      timeSlot: target.timeSlot,
      timeSlotBadge: target.timeSlotBadge,
      isNight: target.isNight,
      dateFormatted,
      dateStr: target.dateStr,
      overallStatus: status,
      overallRecommendation: rec,
      overallAqiLevel: overallAqi.level,
      overallAqiLabel: overallAqi.label,
      regions,
    };
  });

  return processedWeekend;
}

/**
 * Data fallback offline jika request cuaca gagal
 */
export function getOfflineWeatherFallback(): WeekendDayWeather[] {
  const weekendTargetDays = getCoherentWeekendTargetDays();
  return weekendTargetDays.map((t) => {
    const formatted = t.dObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

    const defaultAqi = evaluateAirQuality(65, 20);
    return {
      dayLabel: t.label,
      timeSlot: t.timeSlot,
      timeSlotBadge: t.timeSlotBadge,
      isNight: t.isNight,
      dateFormatted: formatted,
      dateStr: t.dateStr,
      overallStatus: "ideal" as const,
      overallRecommendation: t.isNight
        ? "Kondisi cuaca malam cerah & sejuk, sangat aman untuk gowes malam (Night Ride) keliling Bekasi"
        : "Kondisi cuaca & udara pagi sangat bagus untuk gowes bersama di Bekasi",
      overallAqiLevel: "moderate" as const,
      overallAqiLabel: "Sedang",
      regions: BEKASI_REGIONS.map((r) => ({
        regionName: r.name,
        landmark: r.landmark,
        temp: t.isNight ? 27 : 26,
        rainProb: 15,
        weatherCode: 1,
        weatherDescription: "Cerah Berawan",
        windSpeed: 8,
        airQuality: defaultAqi,
      })),
    };
  });
}

