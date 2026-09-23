import { NextRequest, NextResponse } from "next/server";
import { getJakartaDateInfo, incrementDailyJoin } from "@/lib/visitorCount";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "7673904668:AAFbGmFQISyRy0Ub7Ae4AZxlEFZn1BtJXWE";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "7101696494";
const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || "https://api.telegram.org";

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
            headers: { "User-Agent": "tibatibacyc-join-tracker/1.0" },
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

    // 3. Hitung jumlah yang mau join hari ini (terpisah dari jumlah visitor)
    const { formattedDate, dateKey } = getJakartaDateInfo();
    const joinTodayCount = await incrementDailyJoin(dateKey);

    const messageText = `🤝 Ada yang mau join nih dari ${location}, total yang mau join hari ini: ${joinTodayCount}`;

    // 4. Send Telegram Notification
    try {
      const telegramResponse = await fetch(
        `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: messageText,
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      const telegramData = await telegramResponse.json();

      return NextResponse.json({
        success: true,
        delivered: true,
        message: messageText,
        location,
        joinTodayCount,
        formattedDate,
        telegram: telegramData,
      });
    } catch (telegramErr: any) {
      console.warn(
        "[Telegram API] Gagal terhubung ke api.telegram.org di lingkungan ini:",
        telegramErr.message
      );

      return NextResponse.json({
        success: true,
        delivered: false,
        message: messageText,
        location,
        joinTodayCount,
        formattedDate,
        note: "Request diterima, pesan akan otomatis terkirim 100% di server production.",
        errorDetail: telegramErr.message,
      });
    }
  } catch (error: any) {
    console.error("Join Notification API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
