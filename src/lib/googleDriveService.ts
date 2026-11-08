import { OAuth2Client } from "google-auth-library";

export interface DriveStorageInfo {
  limit: number | null;
  usage: number;
  usageInDrive: number;
  usageInDriveTrash: number;
  freeBytes: number | null;
  percentUsed: number;
  userEmail?: string;
  userName?: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  createdTime?: string;
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

export function getOAuthClient(redirectUri?: string): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum dikonfigurasi di Environment Variables."
    );
  }

  const effectiveRedirectUri =
    redirectUri ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/api/admin/drive/oauth/callback`
      : "http://localhost:3000/api/admin/drive/oauth/callback");

  return new OAuth2Client(clientId, clientSecret, effectiveRedirectUri);
}

/**
 * Menghasilkan URL otorisasi Google OAuth 2.0 untuk pemilik akun
 * Scope: https://www.googleapis.com/auth/drive.file
 */
export function getOAuthAuthUrl(redirectUri?: string): string {
  const client = getOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
}

/**
 * Menukar authorization code menjadi tokens (access_token & refresh_token)
 */
export async function exchangeCodeForTokens(code: string, redirectUri?: string) {
  const client = getOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  return tokens;
}

/**
 * Mendapatkan Access Token aktif dari refresh token
 */
export async function getGoogleAccessToken(): Promise<string> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "GOOGLE_REFRESH_TOKEN belum dikonfigurasi. Silakan lakukan otorisasi Google Drive terlebih dahulu."
    );
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  try {
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new Error(
        "Gagal memperoleh access token Google Drive. Refresh token mungkin kedaluwarsa atau dicabut."
      );
    }
    return token;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("invalid_grant")) {
      throw new Error(
        "invalid_grant: Refresh token Google Drive tidak valid atau telah dicabut. Harap hubungkan ulang Google Drive pemilik."
      );
    }
    throw error;
  }
}

/**
 * Mendapatkan ID folder induk 'Kegiatan' (Dokumentasi TibatibaCYC)
 */
export async function getRootFolderId(token?: string): Promise<string> {
  const configuredRootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (configuredRootId && configuredRootId.trim()) {
    return configuredRootId.trim();
  }

  // Jika belum diset di env, cari atau buat folder 'Kegiatan TibatibaCYC'
  const accessToken = token || (await getGoogleAccessToken());
  const folderName = "Kegiatan TibatibaCYC";

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  )}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Buat folder baru jika belum ada
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat folder induk di Google Drive: ${errText}`);
  }

  const createdData = await createRes.json();
  return createdData.id;
}

/**
 * Memeriksa kapasitas dan penggunaan penyimpanan Google Drive pemilik
 */
export async function getDriveStorageInfo(): Promise<DriveStorageInfo> {
  const token = await getGoogleAccessToken();
  const url = "https://www.googleapis.com/drive/v3/about?fields=storageQuota,user";

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengambil data kuota Google Drive: ${errText}`);
  }

  const data = await res.json();
  const quota = data.storageQuota || {};
  const user = data.user || {};

  const limit = quota.limit ? Number(quota.limit) : null;
  const usage = quota.usage ? Number(quota.usage) : 0;
  const usageInDrive = quota.usageInDrive ? Number(quota.usageInDrive) : 0;
  const usageInDriveTrash = quota.usageInDriveTrash ? Number(quota.usageInDriveTrash) : 0;
  const freeBytes = limit !== null ? Math.max(0, limit - usage) : null;
  const percentUsed = limit ? Math.min(100, Math.round((usage / limit) * 1000) / 10) : 0;

  return {
    limit,
    usage,
    usageInDrive,
    usageInDriveTrash,
    freeBytes,
    percentUsed,
    userEmail: user.emailAddress,
    userName: user.displayName,
  };
}

/**
 * Mendapatkan daftar folder kegiatan di dalam folder induk
 */
export async function listDriveKegiatanFolders(): Promise<DriveFolderItem[]> {
  const token = await getGoogleAccessToken();
  const rootId = await getRootFolderId(token);

  const query = `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&orderBy=name%20desc&fields=files(id,name,createdTime)&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengambil daftar folder kegiatan dari Google Drive: ${errText}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: { id: string; name: string; createdTime?: string }) => ({
    id: f.id,
    name: f.name,
    createdTime: f.createdTime,
  }));
}

/**
 * Mengubah izin akses folder/file menjadi 'Siapa saja yang memiliki link: Pelihat (Viewer)'
 */
export async function setFolderPublicViewer(
  fileId: string,
  passedToken?: string
): Promise<boolean> {
  const token = passedToken || (await getGoogleAccessToken());
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Gagal set permission public viewer untuk ${fileId}:`, errText);
      return false;
    }
    return true;
  } catch (err: unknown) {
    console.warn("Gagal set permission public viewer:", err);
    return false;
  }
}

/**
 * Membuat atau memakai ulang folder kegiatan: YYYY-MM-DD Nama Kegiatan
 * Otomatis mengatur izin akses menjadi 'Siapa saja yang memiliki link: Pelihat'
 */
export async function getOrCreateKegiatanFolder(
  date: string,
  rawName: string
): Promise<{ id: string; name: string; isNew: boolean }> {
  const token = await getGoogleAccessToken();
  const rootId = await getRootFolderId(token);

  const trimmedName = rawName.trim();
  // Format standar: YYYY-MM-DD Nama Kegiatan
  const folderName = trimmedName.startsWith(date)
    ? trimmedName
    : `${date} ${trimmedName}`;

  // Cari apakah folder bernama sama sudah ada
  const escapedName = folderName.replace(/'/g, "\\'");
  const query = `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      const existingId = data.files[0].id;
      // Pastikan folder yang sudah ada juga berizin 'anyone with link: viewer'
      await setFolderPublicViewer(existingId, token);
      return {
        id: existingId,
        name: data.files[0].name,
        isNew: false,
      };
    }
  }

  // Buat folder baru
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat folder kegiatan "${folderName}": ${errText}`);
  }

  const created = await createRes.json();
  // Otomatis ubah izin akses folder menjadi 'Siapa saja yang memiliki link: Pelihat'
  await setFolderPublicViewer(created.id, token);

  return {
    id: created.id,
    name: folderName,
    isNew: true,
  };
}

/**
 * Memastikan subfolder 'foto' atau 'video' ada di dalam folder kegiatan
 */
export async function getOrCreateSubfolder(
  parentFolderId: string,
  kind: "foto" | "video",
  passedToken?: string
): Promise<{ id: string; name: string }> {
  const token = passedToken || (await getGoogleAccessToken());

  const query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${kind}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return { id: data.files[0].id, name: kind };
    }
  }

  // Buat subfolder jika belum ada
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: kind,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat subfolder "${kind}": ${errText}`);
  }

  const created = await createRes.json();
  return { id: created.id, name: kind };
}

/**
 * Format timestamp Jakarta YYYYMMDD-HHmmss
 */
export function formatJakartaTimestamp(d: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  return `${get("year")}${get("month")}${get("day")}-${get("hour")}${get("minute")}${get("second")}`;
}

/**
 * Memvalidasi apakah ekstensi / mimeType cocok dengan kind ('foto' atau 'video')
 */
export function validateMediaKind(
  fileName: string,
  mimeType: string,
  kind: "foto" | "video"
): boolean {
  const ext = (fileName.split(".").pop() || "").toLowerCase();

  const photoExtensions = ["jpg", "jpeg", "png", "heic", "heif"];
  const videoExtensions = ["mp4", "mov", "webm"];

  if (kind === "foto") {
    return (
      photoExtensions.includes(ext) ||
      mimeType.startsWith("image/") ||
      mimeType === "application/octet-stream"
    );
  }

  if (kind === "video") {
    return (
      videoExtensions.includes(ext) ||
      mimeType.startsWith("video/") ||
      mimeType === "video/quicktime"
    );
  }

  return false;
}

/**
 * Membuat Sesi Resumable Upload langsung ke Google Drive
 */
export async function createResumableUploadSession(params: {
  eventFolderId: string;
  kind: "foto" | "video";
  fileName: string;
  mimeType: string;
  size: number;
  origin?: string | null;
}): Promise<{
  uploadUrl: string;
  formattedFileName: string;
  targetFolderId: string;
  kind: "foto" | "video";
}> {
  const { eventFolderId, kind, fileName, mimeType, size, origin } = params;

  const token = await getGoogleAccessToken();
  const rootId = await getRootFolderId(token);

  // 1. Keamanan: pastikan eventFolderId merupakan folder valid di bawah folder induk
  const checkFolderUrl = `https://www.googleapis.com/drive/v3/files/${eventFolderId}?fields=id,name,parents,trashed`;
  const checkFolderRes = await fetch(checkFolderUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!checkFolderRes.ok) {
    throw new Error("Folder kegiatan tidak ditemukan atau tidak dapat diakses di Google Drive.");
  }

  const folderData = await checkFolderRes.json();
  if (folderData.trashed) {
    throw new Error("Folder kegiatan berada di tempat sampah.");
  }

  const parents: string[] = folderData.parents || [];
  if (!parents.includes(rootId)) {
    throw new Error(
      "Akses ditolak: Folder tujuan bukan merupakan subfolder kegiatan di bawah folder induk."
    );
  }

  // 2. Validasi kind terhadap tipe file
  if (!validateMediaKind(fileName, mimeType, kind)) {
    throw new Error(`Tipe file "${fileName}" tidak sesuai dengan kategori ${kind}.`);
  }

  // 3. Pastikan subfolder ('foto' atau 'video') sudah ada
  const subfolder = await getOrCreateSubfolder(eventFolderId, kind, token);

  // 4. Format nama file unik: YYYYMMDD-HHmmss_nama-asli.ext
  const timestamp = formatJakartaTimestamp();
  const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const formattedFileName = `${timestamp}_${sanitizedOriginal}`;

  // 5. Inisiasi Resumable Upload Session ke Google Drive API
  const sessionUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Type": mimeType || "application/octet-stream",
    "X-Upload-Content-Length": size.toString(),
  };

  // Meneruskan Origin agar Google Drive menyertakan header CORS pada uploadUrl
  if (origin) {
    headers["Origin"] = origin;
  }

  const sessionRes = await fetch(sessionUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: formattedFileName,
      parents: [subfolder.id],
    }),
  });

  if (!sessionRes.ok) {
    const errText = await sessionRes.text();
    if (sessionRes.status === 403 && errText.includes("storageQuotaExceeded")) {
      throw new Error(
        "Kapasitas Google Drive penuh (storageQuotaExceeded). Tidak dapat membuat sesi upload."
      );
    }
    throw new Error(`Gagal membuat sesi upload di Google Drive: ${errText}`);
  }

  const uploadUrl = sessionRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("Google Drive tidak mengembalikan URL upload sesi (Location header kosong).");
  }

  return {
    uploadUrl,
    formattedFileName,
    targetFolderId: subfolder.id,
    kind,
  };
}
