import { NextRequest, NextResponse } from "next/server";
import { getJakartaDateInfo, incrementDailyVisitor } from "@/lib/visitorCount";
import { sendTelegramNotification } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tibatibacyc.my.id";

export async function POST(req: NextRequest) {
  try {
    let location = "Lokasi tidak diketahui";

    // 1. Read location from client body if provided
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    if (body.location && typeof body.location === "string" && body.location.trim().length > 0) {
      location = body.location.trim();
    } else {
      // 2. Server-side lookup fallback via ipapi.co
      const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const realIp = req.headers.get("x-real-ip");
      const clientIp = forwardedIp || realIp;

      if (clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1") {
        try {
          const res = await fetch(`https://ipapi.co/${clientIp}/json/`, {
            headers: { "User-Agent": "tibatibacyc-visitor-tracker/1.0" },
            cache: "no-store",
            signal: AbortSignal.timeout(3000),
          });
          if (res.ok) {
            const data = await res.json();
            const parts = [data.city, data.region, data.country_name].filter(Boolean);
            if (parts.length > 0) {
              location = parts.join(", ");
            }
          }
        } catch {
          // ignore lookup error
        }
      }
    }

    // 3. Hitung jumlah pengunjung hari ini
    const { formattedDate, dateKey } = getJakartaDateInfo();
    const visitorTodayCount = await incrementDailyVisitor(dateKey);

    const messageText =
      `🚲 Ada yang mampir dari ${location}\n\n` +
      `📊 Jumlah pengunjung tanggal ${formattedDate} : ${visitorTodayCount} Pengunjung`;

    // 4. Send Telegram Notification
    const telegramResult = await sendTelegramNotification({
      text: messageText,
    });

    return NextResponse.json({
      success: true,
      delivered: telegramResult.delivered,
      allDelivered: telegramResult.allDelivered,
      totalTargets: telegramResult.totalTargets,
      deliveredCount: telegramResult.deliveredCount,
      message: messageText,
      location,
      visitorTodayCount,
      formattedDate,
      ...(telegramResult.note ? { note: telegramResult.note } : {}),
      ...(telegramResult.errorDetail
        ? { errorDetail: telegramResult.errorDetail }
        : {}),
      telegram: telegramResult.results,
    });
  } catch (error: any) {
    console.error("Visitor Notification API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
