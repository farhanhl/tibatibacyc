import { NextResponse } from "next/server";
import {
  fetchWeekendWeatherFromOpenMeteo,
  getOfflineWeatherFallback,
} from "@/lib/weatherService";

export const revalidate = 1800; // Cache 30 menit (ISR)

export async function GET() {
  try {
    const data = await fetchWeekendWeatherFromOpenMeteo();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data cuaca dari Open-Meteo:", error);
    const fallback = getOfflineWeatherFallback();
    return NextResponse.json(fallback, {
      headers: {
        "Cache-Control": "public, s-maxage=300",
      },
    });
  }
}

