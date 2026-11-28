import { NextRequest, NextResponse } from "next/server";
import { getJakartaDateInfo, incrementDailyJoin } from "@/lib/visitorCount";
import { sendTelegramNotification } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    let location = "Lokasi tidak diketahui";

    // 1. Read body data
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const domisili = typeof body.domisili === "string" ? body.domisili.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const titikKumpul = typeof body.titikKumpul === "string" ? body.titikKumpul.trim() : "";
    const statusPelajar = typeof body.statusPelajar === "string" ? body.statusPelajar.trim() : "";
    const sumberInfo = typeof body.sumberInfo === "string" ? body.sumberInfo.trim() : "";

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

    // 4. Susun pesan Telegram
    const hasMemberData = Boolean(
      nama || domisili || phone || titikKumpul || statusPelajar || sumberInfo
    );

    // Format nomor WhatsApp untuk direct chat link
    const phoneDigits = phone.replace(/\D/g, "");
    const waNumber = phoneDigits.startsWith("0")
      ? "62" + phoneDigits.slice(1)
      : phoneDigits.startsWith("62")
        ? phoneDigits
        : "62" + phoneDigits;

    const phoneLink = phoneDigits
      ? `<a href="https://wa.me/${waNumber}">${escapeHtml(phone)}</a>`
      : escapeHtml(phone || "-");

    const messageText = hasMemberData
      ? `🚴 <b>Calon Member Baru Ingin Bergabung!</b>\n\n` +
      `👤 <b>Nama:</b> ${escapeHtml(nama || "-")}\n` +
      `📍 <b>Domisili:</b> ${escapeHtml(domisili || "-")}\n` +
      `📱 <b>No. HP/WA:</b> ${phoneLink}\n` +
      `🚲 <b>Titik Kumpul:</b> ${escapeHtml(titikKumpul || "-")}\n` +
      `🎓 <b>Status:</b> ${escapeHtml(statusPelajar || "-")}\n` +
      `📣 <b>Tau Dari:</b> ${escapeHtml(sumberInfo || "-")}\n` +
      `🌐 <b>Lokasi IP:</b> ${escapeHtml(location)}\n` +
      `📊 <b>Total Join Hari Ini:</b> ${joinTodayCount}\n` +
      `📅 <b>Tanggal:</b> ${formattedDate}`
      : `🤝 Ada yang mau join nih dari ${escapeHtml(location)}, total yang mau join hari ini: ${joinTodayCount}`;

    // 6. Send Telegram Notification
    const telegramResult = await sendTelegramNotification({
      text: messageText,
      parseMode: "HTML",
    });

    return NextResponse.json({
      success: true,
      delivered: telegramResult.delivered,
      allDelivered: telegramResult.allDelivered,
      totalTargets: telegramResult.totalTargets,
      deliveredCount: telegramResult.deliveredCount,
      message: messageText,
      location,
      joinTodayCount,
      formattedDate,
      ...(telegramResult.note ? { note: telegramResult.note } : {}),
      ...(telegramResult.errorDetail
        ? { errorDetail: telegramResult.errorDetail }
        : {}),
      telegram: telegramResult.results,
    });
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
