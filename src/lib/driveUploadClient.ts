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
 * Konversi HEIC ke JPEG di browser (client-side) dengan kualitas 0.92
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Dynamic import heic2any karena membutuhkan objek browser window & canvas
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

  const finalBlob: Blob = Array.isArray(result) ? result[0] : result;
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
