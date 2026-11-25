export interface TelegramSendResult {
  chatId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface SendTelegramMessageOptions {
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  botToken?: string;
  chatIds?: string[];
  apiUrl?: string;
}

export interface SendTelegramBroadcastResult {
  configured: boolean;
  delivered: boolean;
  allDelivered: boolean;
  totalTargets: number;
  deliveredCount: number;
  failedCount: number;
  results: TelegramSendResult[];
  note?: string;
  errorDetail?: string;
}

/**
 * Mem-parsing satu atau lebih Telegram Chat ID dari string env.
 * Mendukung pemisah koma, titik koma, spasi, newline, maupun format JSON array.
 */
export function parseTelegramChatIds(
  ...rawValues: Array<string | undefined | null>
): string[] {
  const uniqueIds = new Set<string>();

  for (const raw of rawValues) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const id = String(item).trim();
            if (id) uniqueIds.add(id);
          }
          continue;
        }
      } catch {
        // Fallback ke pemisahan berbasis delimiter jika bukan JSON valid
      }
    }

    const parts = trimmed.split(/[\s,;]+/);
    for (const part of parts) {
      const cleaned = part.replace(/^['"]+|['"]+$/g, "").trim();
      if (cleaned) {
        uniqueIds.add(cleaned);
      }
    }
  }

  return Array.from(uniqueIds);
}

/**
 * Mengambil konfigurasi bot Telegram dari environment variables.
 */
export function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const chatIds = parseTelegramChatIds(
    process.env.TELEGRAM_CHAT_ID,
    process.env.TELEGRAM_CHAT_IDS
  );
  const apiUrl = (
    process.env.TELEGRAM_API_URL?.trim() || "https://api.telegram.org"
  ).replace(/\/+$/, "");

  return { botToken, chatIds, apiUrl };
}

async function sendToSingleChat(
  apiUrl: string,
  botToken: string,
  chatId: string,
  text: string,
  parseMode?: "HTML" | "Markdown" | "MarkdownV2"
): Promise<TelegramSendResult> {
  try {
    const payload: Record<string, string> = {
      chat_id: chatId,
      text,
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const response = await fetch(`${apiUrl}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    let data: Record<string, unknown> | null = null;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }

    const ok = response.ok && data?.ok !== false;
    if (!ok) {
      const description =
        typeof data?.description === "string" ? data.description : "";
      const errorMsg =
        description || `HTTP ${response.status} ${response.statusText}`.trim();
      console.warn(`[Telegram API] Gagal kirim ke chat_id ${chatId}:`, errorMsg);
      return { chatId, ok: false, data, error: errorMsg };
    }

    return { chatId, ok: true, data };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown network error";
    console.warn(
      `[Telegram API] Gagal terhubung ke ${apiUrl} untuk chat_id ${chatId}:`,
      errorMsg
    );
    return { chatId, ok: false, error: errorMsg };
  }
}

/**
 * Mengirim pesan Telegram ke seluruh target chat ID yang terkonfigurasi secara paralel.
 * Kegagalan pada satu chat ID tidak menggagalkan pengiriman ke chat ID lainnya.
 */
export async function sendTelegramNotification(
  options: SendTelegramMessageOptions
): Promise<SendTelegramBroadcastResult> {
  const envConfig = getTelegramConfig();
  const botToken = options.botToken?.trim() ?? envConfig.botToken;
  const chatIds = options.chatIds ?? envConfig.chatIds;
  const apiUrl = (options.apiUrl?.trim() || envConfig.apiUrl).replace(
    /\/+$/,
    ""
  );

  if (!botToken || chatIds.length === 0) {
    return {
      configured: false,
      delivered: false,
      allDelivered: false,
      totalTargets: chatIds.length,
      deliveredCount: 0,
      failedCount: chatIds.length,
      results: [],
      note: "Notifikasi Telegram dilewati karena TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum disetel.",
    };
  }

  const results = await Promise.all(
    chatIds.map((chatId) =>
      sendToSingleChat(apiUrl, botToken, chatId, options.text, options.parseMode)
    )
  );

  const deliveredCount = results.filter((r) => r.ok).length;
  const failedCount = results.length - deliveredCount;
  const delivered = deliveredCount > 0;
  const allDelivered = deliveredCount === results.length;

  let note: string | undefined;
  let errorDetail: string | undefined;

  if (!delivered) {
    const errors = Array.from(
      new Set(results.map((r) => r.error).filter((e): e is string => Boolean(e)))
    );
    const hasNetworkFailure = results.some((r) => r.data === undefined);
    note = hasNetworkFailure
      ? "Request diterima, namun koneksi ke api.telegram.org gagal atau dibatasi di lingkungan lokal. Di server production, pesan akan terkirim."
      : "Request diterima, namun pengiriman ke Telegram gagal. Periksa TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID.";
    if (errors.length > 0) {
      errorDetail = errors.join("; ");
    }
  } else if (failedCount > 0) {
    note = `Terkirim ke ${deliveredCount} dari ${results.length} Telegram Chat ID.`;
  }

  return {
    configured: true,
    delivered,
    allDelivered,
    totalTargets: results.length,
    deliveredCount,
    failedCount,
    results,
    ...(note ? { note } : {}),
    ...(errorDetail ? { errorDetail } : {}),
  };
}
