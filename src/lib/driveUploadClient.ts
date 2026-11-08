export type MediaKind = "foto" | "video";

export type UploadItemStatus =
  | "menunggu"
  | "mengonversi"
  | "mengupload"
  | "berhasil"
  | "gagal";

export interface QueueItem {
  id: string;
  originalFile: File;
  fileToUpload: File;
  kind: MediaKind;
  isHeic: boolean;
  convertedBlob?: Blob;
  status: UploadItemStatus;
  progressPercent: number;
  uploadedBytes: number;
  totalBytes: number;
  uploadUrl?: string;
  error?: string;
  targetFileName?: string;
  driveFileId?: string;
}

export const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB (kelipatan 256 KB)
export const MAX_PHOTO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Mendeteksi apakah file adalah gambar HEIC/HEIF
 */
export function isHeicFile(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    ext === "heic" ||
    ext === "heif" ||
    type === "image/heic" ||
    type === "image/heif"
  );
}

/**
 * Menentukan apakah file termasuk foto atau video
 */
export function detectMediaKind(file: File): MediaKind | null {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  const photoExts = ["jpg", "jpeg", "png", "heic", "heif"];
  const videoExts = ["mp4", "mov", "webm"];

  if (photoExts.includes(ext) || type.startsWith("image/")) {
    return "foto";
  }

  if (videoExts.includes(ext) || type.startsWith("video/")) {
    return "video";
  }

  return null;
}

/**
 * Format error apa pun (Error, object libheif, string) menjadi pesan teks yang jelas.
 * Mencegah munculnya string "[object Object]" pada antarmuka admin.
 */
export function formatUploadError(err: unknown): string {
  if (!err) return "Terjadi kesalahan tidak diketahui.";
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message) return obj.message;
    if (typeof obj.error === "string" && obj.error) return obj.error;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

/**
 * Konversi HEIC ke JPEG di browser (client-side) dengan kualitas 0.92.
 * Menggunakan heic-to (libheif 1.23+ modern) yang mendukung foto iPhone terbaru (iOS 16/17/18+),
 * dengan fallback ke heic2any bila diperlukan.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  let finalBlob: Blob | null = null;
  let lastError: unknown = null;

  // 1. Coba menggunakan heic-to (versi libheif modern)
  try {
    const { heicTo } = await import("heic-to");
    finalBlob = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.92,
    });
  } catch (err: unknown) {
    lastError = err;
    console.warn("heic-to gagal mengonversi, mencoba fallback heic2any...", err);
  }

  // 2. Fallback ke heic2any jika heic-to gagal
  if (!finalBlob) {
    try {
      const heic2anyModule = await import("heic2any");
      const heic2any = (heic2anyModule.default || heic2anyModule) as (options: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;

      const result = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92,
      });

      finalBlob = Array.isArray(result) ? result[0] : result;
    } catch (fallbackErr: unknown) {
      console.error("heic2any fallback juga gagal:", fallbackErr);
      const detail = formatUploadError(lastError || fallbackErr);
      throw new Error(detail || "Gagal mendekode format HEIC.");
    }
  }

  if (!finalBlob) {
    const detail = formatUploadError(lastError);
    throw new Error(detail || "Hasil konversi HEIC kosong.");
  }

  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

  return new File([finalBlob], newName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Format ukuran byte ke string terbaca (KB, MB, GB, TB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Mengirim satu potongan chunk ke Google Drive
 * Menggunakan direct fetch, dan fallback ke API proxy jika terjadi error CORS
 */
export async function sendChunkWithFallback(
  uploadUrl: string,
  chunk: Blob,
  contentRange: string,
  contentType: string
): Promise<{ status: number; rangeHeader: string | null; responseText: string }> {
  try {
    // 1. Coba upload langsung dari browser ke URL sesi Google Drive
    const directRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": contentRange,
        "Content-Type": contentType,
      },
      body: chunk,
    });

    return {
      status: directRes.status,
      rangeHeader: directRes.headers.get("range"),
      responseText: await directRes.text(),
    };
  } catch (directErr) {
    // 2. Jika direct upload diblokir CORS atau gagal jaringan, fallback ke endpoint proxy
    console.warn("Direct upload ke Google Drive gagal/CORS, beralih ke proxy:", directErr);

    const proxyRes = await fetch("/api/admin/drive/upload-chunk", {
      method: "PUT",
      headers: {
        "x-upload-url": uploadUrl,
        "content-range": contentRange,
        "content-type": contentType,
      },
      body: chunk,
    });

    return {
      status: proxyRes.status,
      rangeHeader: proxyRes.headers.get("range"),
      responseText: await proxyRes.text(),
    };
  }
}

/**
 * Menanyakan posisi terakhir chunk yang diterima Google Drive (Resume Check)
 */
export async function queryResumePosition(
  uploadUrl: string,
  totalBytes: number
): Promise<number> {
  const contentRange = `bytes */${totalBytes}`;
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": contentRange,
      },
    });

    if (res.status === 308) {
      const range = res.headers.get("range");
      if (range) {
        const match = range.match(/bytes=0-(\d+)/);
        if (match && match[1]) {
          return parseInt(match[1], 10) + 1;
        }
      }
    }
  } catch {
    // Coba via proxy jika direct gagal
    try {
      const proxyRes = await fetch("/api/admin/drive/upload-chunk", {
        method: "PUT",
        headers: {
          "x-upload-url": uploadUrl,
          "content-range": contentRange,
        },
      });
      if (proxyRes.status === 308) {
        const range = proxyRes.headers.get("range");
        if (range) {
          const match = range.match(/bytes=0-(\d+)/);
          if (match && match[1]) {
            return parseInt(match[1], 10) + 1;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return 0;
}
