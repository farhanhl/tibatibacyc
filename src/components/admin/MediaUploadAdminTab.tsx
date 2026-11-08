"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  QueueItem,
  CHUNK_SIZE,
  MAX_PHOTO_SIZE_BYTES,
  isHeicFile,
  detectMediaKind,
  convertHeicToJpeg,
  formatBytes,
  formatUploadError,
  sendChunkWithFallback,
  queryResumePosition,
} from "@/lib/driveUploadClient";

interface DriveEventFolder {
  id: string;
  name: string;
  createdTime?: string;
}

interface StorageQuotaData {
  limit: number | null;
  usage: number;
  freeBytes: number | null;
  percentUsed: number;
  userEmail?: string;
  userName?: string;
}

export default function MediaUploadAdminTab() {
  // Drive & Auth State
  const [isDriveConfigured, setIsDriveConfigured] = useState<boolean | null>(null);
  const [driveFolders, setDriveFolders] = useState<DriveEventFolder[]>([]);
  const [storageData, setStorageData] = useState<StorageQuotaData | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(true);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [oauthAuthUrl, setOauthAuthUrl] = useState<string | null>(null);

  // Event Selection State
  const [eventSelectionMode, setEventSelectionMode] = useState<"existing" | "new">("existing");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedFolderName, setSelectedFolderName] = useState<string>("");
  const [newEventDate, setNewEventDate] = useState<string>(() => {
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return jakartaFormatter.format(now);
  });
  const [newEventName, setNewEventName] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // Queue State
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploadingActive, setIsUploadingActive] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  // State untuk mendeteksi proses transfer file dari galeri iOS (bisa makan waktu lama untuk video banyak/besar)
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelledRef = useRef<boolean>(false);
  const activeWorkersRef = useRef<number>(0);

  const handleCopyFolderLink = async () => {
    if (!selectedFolderId) return;
    const folderUrl = `https://drive.google.com/drive/folders/${selectedFolderId}`;
    try {
      await navigator.clipboard.writeText(folderUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt("Salin link folder Google Drive berikut:", folderUrl);
    }
  };

  // 1. Refresh Google Drive data & storage info on demand
  const handleRefreshDriveData = useCallback(async () => {
    setIsLoadingDrive(true);
    setDriveError(null);

    try {
      // Check Events & Configuration
      const eventsRes = await fetch("/api/admin/drive/events");
      const eventsJson = await eventsRes.json();

      if (!eventsRes.ok || eventsJson.isConfigured === false) {
        setIsDriveConfigured(false);
        setDriveError(eventsJson.error || "Google Drive belum dikonfigurasi.");

        // Fetch OAuth URL if available
        try {
          const authUrlRes = await fetch("/api/admin/drive/oauth/url");
          const authUrlJson = await authUrlRes.json();
          if (authUrlJson.authUrl) {
            setOauthAuthUrl(authUrlJson.authUrl);
          }
        } catch {
          // ignore
        }
        return;
      }

      setIsDriveConfigured(true);
      const fetchedFolders: DriveEventFolder[] = eventsJson.events || [];
      setDriveFolders(fetchedFolders);

      if (fetchedFolders.length > 0 && !selectedFolderId) {
        setSelectedFolderId(fetchedFolders[0].id);
        setSelectedFolderName(fetchedFolders[0].name);
      }

      // Check Storage Quota
      const storageRes = await fetch("/api/admin/drive/storage");
      if (storageRes.ok) {
        const storageJson = await storageRes.json();
        if (storageJson.storage) {
          setStorageData(storageJson.storage);
        }
      }
    } catch (err: unknown) {
      console.error("Gagal inisialisasi Google Drive:", err);
      const message = err instanceof Error ? err.message : "Koneksi ke Google Drive gagal.";
      setDriveError(message);
      setIsDriveConfigured(false);
    } finally {
      setIsLoadingDrive(false);
    }
  }, [selectedFolderId]);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;

    const init = async () => {
      try {
        const eventsRes = await fetch("/api/admin/drive/events");
        const eventsJson = await eventsRes.json();
        if (ignore) return;

        if (!eventsRes.ok || eventsJson.isConfigured === false) {
          setIsDriveConfigured(false);
          setDriveError(eventsJson.error || "Google Drive belum dikonfigurasi.");

          try {
            const authUrlRes = await fetch("/api/admin/drive/oauth/url");
            const authUrlJson = await authUrlRes.json();
            if (!ignore && authUrlJson.authUrl) {
              setOauthAuthUrl(authUrlJson.authUrl);
            }
          } catch {
            // ignore
          }
          return;
        }

        setIsDriveConfigured(true);
        const fetchedFolders: DriveEventFolder[] = eventsJson.events || [];
        setDriveFolders(fetchedFolders);

        if (fetchedFolders.length > 0) {
          setSelectedFolderId(fetchedFolders[0].id);
          setSelectedFolderName(fetchedFolders[0].name);
        }

        const storageRes = await fetch("/api/admin/drive/storage");
        if (storageRes.ok && !ignore) {
          const storageJson = await storageRes.json();
          if (storageJson.storage) {
            setStorageData(storageJson.storage);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Koneksi ke Google Drive gagal.";
          setDriveError(message);
          setIsDriveConfigured(false);
        }
      } finally {
        if (!ignore) {
          setIsLoadingDrive(false);
        }
      }
    };

    init();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Prevent accidental tab close during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploadingActive) {
        e.preventDefault();
        e.returnValue = "Proses upload media sedang berjalan. Yakin ingin meninggalkan halaman?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUploadingActive]);

  // 3. Handle File Selection & Validation
  const handleAddFiles = (files: FileList | File[]) => {
    setIsLoadingFiles(true);
    setTimeout(() => {
      try {
        const newItems: QueueItem[] = [];
        const rejectedMessages: string[] = [];

        Array.from(files).forEach((file) => {
          const kind = detectMediaKind(file);
          if (!kind) {
            rejectedMessages.push(
              `"${file.name}": Format tidak didukung. Hanya menerima foto (HEIC, JPG, PNG) dan video (MP4, MOV, WebM).`
            );
            return;
          }

          const isHeic = isHeicFile(file);

          // Validasi batas ukuran foto sebelum konversi (50 MB)
          if (kind === "foto" && file.size > MAX_PHOTO_SIZE_BYTES) {
            rejectedMessages.push(
              `"${file.name}": Ukuran foto melebihi batas 50 MB (${formatBytes(file.size)}).`
            );
            return;
          }

          const item: QueueItem = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            originalFile: file,
            fileToUpload: file,
            kind,
            isHeic,
            status: "menunggu",
            progressPercent: 0,
            uploadedBytes: 0,
            totalBytes: file.size,
          };

          newItems.push(item);
        });

        if (rejectedMessages.length > 0) {
          alert("Beberapa file dilewati:\n\n" + rejectedMessages.join("\n"));
        }

        if (newItems.length > 0) {
          setQueue((prev) => [...prev, ...newItems]);
        }
      } finally {
        setIsLoadingFiles(false);
      }
    }, 50);
  };

  /**
   * Handler pemilihan file decoupled dari event loop sinkron WebKit iOS
   * untuk mencegah browser freeze saat memindahkan FileList berukuran gigabyte.
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = e.target;
    const fileList = inputElement.files;
    if (!fileList || fileList.length === 0) return;

    // Salin objek file ke array sebelum event loop me-reset input
    const filesArray = Array.from(fileList);
    setIsLoadingFiles(true);

    requestAnimationFrame(() => {
      setTimeout(() => {
        handleAddFiles(filesArray);
        try {
          inputElement.value = "";
        } catch {
          // ignore
        }
      }, 30);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // 4. Create new event folder
  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) {
      alert("Harap masukkan nama kegiatan.");
      return;
    }

    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/admin/drive/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newEventDate,
          name: newEventName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat folder kegiatan di Google Drive.");
      }

      const created = data.folder;
      // Tambahkan ke daftar folder jika belum ada
      setDriveFolders((prev) => {
        const exists = prev.some((f) => f.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });

      setSelectedFolderId(created.id);
      setSelectedFolderName(created.name);
      setEventSelectionMode("existing");
      setNewEventName("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Error: " + message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // 5. Upload single item with HEIC conversion and chunking
  const uploadSingleItem = async (
    item: QueueItem,
    targetFolderId: string
  ): Promise<boolean> => {
    if (isCancelledRef.current) return false;

    // A. Tahap Konversi jika HEIC
    let fileToUpload = item.fileToUpload;
    if (item.isHeic && !item.convertedBlob) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "mengonversi" } : q
        )
      );

      try {
        const converted = await convertHeicToJpeg(item.originalFile);
        fileToUpload = converted;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                fileToUpload: converted,
                convertedBlob: converted,
                totalBytes: converted.size,
              }
              : q
          )
        );
      } catch (convErr: unknown) {
        console.error("Gagal konversi HEIC:", convErr);
        const message = formatUploadError(convErr);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                status: "gagal",
                error: "Gagal mengonversi file HEIC ke JPG: " + message,
              }
              : q
          )
        );
        return false;
      }
    }

    if (isCancelledRef.current) return false;

    // B. Buat Sesi Resumable Upload
    let uploadUrl = item.uploadUrl;
    let targetFileName = item.targetFileName;

    if (!uploadUrl) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: "mengupload", progressPercent: 0 }
            : q
        )
      );

      try {
        const sessionRes = await fetch("/api/admin/drive/upload-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventFolderId: targetFolderId,
            kind: item.kind,
            fileName: fileToUpload.name,
            mimeType: fileToUpload.type || "application/octet-stream",
            size: fileToUpload.size,
          }),
        });

        const sessionData = await sessionRes.json();
        if (!sessionRes.ok || !sessionData.success) {
          throw new Error(sessionData.error || "Gagal membuat sesi upload.");
        }

        uploadUrl = sessionData.uploadUrl;
        targetFileName = sessionData.formattedFileName;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                uploadUrl,
                targetFileName,
              }
              : q
          )
        );
      } catch (sessErr: unknown) {
        const message = sessErr instanceof Error ? sessErr.message : "Gagal menginisiasi sesi upload.";
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                status: "gagal",
                error: message,
              }
              : q
          )
        );
        return false;
      }
    }

    if (!uploadUrl || isCancelledRef.current) return false;

    // C. Resumable Chunk Upload Loop (8 MB chunks)
    const totalSize = fileToUpload.size;
    let startByte = item.uploadedBytes || 0;

    // Jika melanjutkan upload yang terputus, query posisi terakhir di Drive
    if (startByte > 0) {
      startByte = await queryResumePosition(uploadUrl, totalSize);
    }

    const contentType = fileToUpload.type || "application/octet-stream";

    while (startByte < totalSize && !isCancelledRef.current) {
      const endByte = Math.min(startByte + CHUNK_SIZE, totalSize) - 1;
      const chunk = fileToUpload.slice(startByte, endByte + 1);
      const contentRange = `bytes ${startByte}-${endByte}/${totalSize}`;

      let retryCount = 0;
      let successChunk = false;

      while (retryCount < 3 && !successChunk && !isCancelledRef.current) {
        try {
          const res = await sendChunkWithFallback(
            uploadUrl,
            chunk,
            contentRange,
            contentType
          );

          if (res.status === 308) {
            // Potongan diterima, lanjut ke chunk berikutnya
            successChunk = true;
            if (res.rangeHeader) {
              const match = res.rangeHeader.match(/bytes=0-(\d+)/);
              if (match && match[1]) {
                startByte = parseInt(match[1], 10) + 1;
              } else {
                startByte = endByte + 1;
              }
            } else {
              startByte = endByte + 1;
            }

            const percent = Math.min(99, Math.round((startByte / totalSize) * 100));
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                    ...q,
                    status: "mengupload",
                    uploadedBytes: startByte,
                    progressPercent: percent,
                  }
                  : q
              )
            );
          } else if (res.status === 200 || res.status === 201) {
            // Selesai seluruh file!
            successChunk = true;
            startByte = totalSize;

            let fileId = "";
            try {
              const json = JSON.parse(res.responseText);
              fileId = json.id || "";
            } catch {
              // ignore
            }

            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                    ...q,
                    status: "berhasil",
                    uploadedBytes: totalSize,
                    progressPercent: 100,
                    driveFileId: fileId,
                    error: undefined,
                  }
                  : q
              )
            );
            return true;
          } else {
            // Status error selain 308 / 200 / 201
            retryCount++;
            if (retryCount >= 3) {
              throw new Error(
                `Google Drive merespons HTTP ${res.status}: ${res.responseText.substring(0, 120)}`
              );
            }
            // Exponential backoff delay
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retryCount)));
          }
        } catch (chunkErr: unknown) {
          retryCount++;
          if (retryCount >= 3) {
            throw chunkErr;
          }
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        }
      }

      if (!successChunk && !isCancelledRef.current) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                status: "gagal",
                error: "Koneksi terputus setelah 3x percobaan.",
              }
              : q
          )
        );
        return false;
      }
    }

    if (isCancelledRef.current) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id && q.status === "mengupload"
            ? { ...q, status: "menunggu" }
            : q
        )
      );
      return false;
    }

    return true;
  };

  // 6. Master Queue Runner with Max 2 Concurrency
  const startUploadQueue = async () => {
    if (!selectedFolderId) {
      alert("Harap pilih atau buat folder kegiatan terlebih dahulu.");
      return;
    }

    const pendingItems = queue.filter(
      (item) => item.status === "menunggu" || item.status === "gagal"
    );

    if (pendingItems.length === 0) {
      alert("Semua file sudah berhasil diupload atau tidak ada file dalam antrean.");
      return;
    }

    isCancelledRef.current = false;
    setIsUploadingActive(true);

    const CONCURRENCY_LIMIT = 2;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < pendingItems.length && !isCancelledRef.current) {
        const itemToProcess = pendingItems[nextIndex];
        nextIndex++;

        activeWorkersRef.current++;
        try {
          await uploadSingleItem(itemToProcess, selectedFolderId);
        } catch (err: unknown) {
          console.error("Worker upload error:", err);
        } finally {
          activeWorkersRef.current--;
        }
      }
    };

    // Jalankan worker paralel (maksimal 2)
    const workers = Array.from({ length: CONCURRENCY_LIMIT }, () => worker());
    await Promise.all(workers);

    setIsUploadingActive(false);
    // Refresh storage data setelah upload selesai
    handleRefreshDriveData();
  };

  const handleStopUpload = () => {
    isCancelledRef.current = true;
    setIsUploadingActive(false);
  };

  const handleRetrySingle = async (itemId: string) => {
    if (!selectedFolderId) {
      alert("Harap pilih folder kegiatan terlebih dahulu.");
      return;
    }

    const item = queue.find((q) => q.id === itemId);
    if (!item) return;

    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId
          ? { ...q, status: "menunggu", error: undefined, progressPercent: 0 }
          : q
      )
    );

    isCancelledRef.current = false;
    setIsUploadingActive(true);
    try {
      await uploadSingleItem(item, selectedFolderId);
    } finally {
      setIsUploadingActive(false);
      handleRefreshDriveData();
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== itemId));
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== "berhasil"));
  };

  const handleClearAll = () => {
    if (isUploadingActive) {
      if (!confirm("Upload sedang berjalan. Yakin ingin membatalkan dan menghapus antrean?")) {
        return;
      }
      handleStopUpload();
    }
    setQueue([]);
  };

  // Queue Statistics
  const totalQueueBytes = queue.reduce((acc, curr) => acc + curr.totalBytes, 0);
  const successCount = queue.filter((q) => q.status === "berhasil").length;
  const failedCount = queue.filter((q) => q.status === "gagal").length;
  const photoQueueCount = queue.filter((q) => q.kind === "foto").length;
  const videoQueueCount = queue.filter((q) => q.kind === "video").length;
  const isStorageWarning =
    storageData?.freeBytes !== null &&
    storageData?.freeBytes !== undefined &&
    totalQueueBytes > storageData.freeBytes;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Google Drive Status */}
      <div className="bg-black/60 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📸</span>
              <h2
                className="text-lg sm:text-xl font-black uppercase text-white tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Tools Upload Media Dokumentasi
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Upload foto & video ke Google Drive dengan auto-konversi HEIC ke JPG untuk pengguna Android.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshDriveData}
              disabled={isLoadingDrive}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-300 transition-colors border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span>
              <span>{isLoadingDrive ? "Memeriksa..." : "Refresh Status"}</span>
            </button>
          </div>
        </div>

        {/* Not Configured Alert */}
        {isDriveConfigured === false && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="text-lg shrink-0">⚠️</span>
              <div className="space-y-1">
                <p className="font-bold text-amber-300">
                  Google Drive Belum Terhubung atau Kredensial Belum Lengkap
                </p>
                <p className="text-gray-300">
                  {driveError ||
                    "Pastikan `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REFRESH_TOKEN` telah diatur di Environment Variables."}
                </p>
              </div>
            </div>

            {oauthAuthUrl && (
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={oauthAuthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C44341] hover:bg-[#A93434] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                >
                  <span>🔗</span>
                  <span>Hubungkan Google Drive Sekarang</span>
                  <span>↗</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Drive Storage Quota Widget */}
        {isDriveConfigured && storageData && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
              <span className="text-gray-300">
                Penyimpanan Google Drive:{" "}
                <span className="text-white font-bold">
                  {formatBytes(storageData.usage)}
                </span>{" "}
                terpakai dari{" "}
                <span className="text-white font-bold">
                  {storageData.limit ? formatBytes(storageData.limit) : "Tak Terbatas"}
                </span>
                {storageData.userEmail && (
                  <span className="text-gray-400 ml-1">({storageData.userEmail})</span>
                )}
              </span>
              <span
                className={`font-bold ${storageData.percentUsed > 90
                    ? "text-red-400"
                    : storageData.percentUsed > 70
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
              >
                Sisa:{" "}
                {storageData.freeBytes !== null
                  ? formatBytes(storageData.freeBytes)
                  : "Besar"}{" "}
                ({storageData.percentUsed}% terpakai)
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${storageData.percentUsed > 90
                    ? "bg-red-500"
                    : storageData.percentUsed > 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                style={{ width: `${Math.max(2, storageData.percentUsed)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Event / Kegiatan Selection */}
      <div className="bg-black/60 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <h3
          className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>📁</span>
          <span>1. Pilih Folder Kegiatan Dokumentasi</span>
        </h3>

        {/* Tab Mode Selection */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setEventSelectionMode("existing")}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${eventSelectionMode === "existing"
                ? "bg-[#C44341] text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
              }`}
          >
            Pilih Folder Yang Ada ({driveFolders.length})
          </button>
          <button
            type="button"
            onClick={() => setEventSelectionMode("new")}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${eventSelectionMode === "new"
                ? "bg-[#C44341] text-white"
                : "bg-white/5 text-gray-400 hover:text-white"
              }`}
          >
            + Buat Kegiatan Baru
          </button>
        </div>

        {eventSelectionMode === "existing" ? (
          <div className="space-y-3">
            <label className="block text-xs font-mono text-gray-300">
              Pilih dari daftar kegiatan di Google Drive:
            </label>
            {driveFolders.length > 0 ? (
              <select
                value={selectedFolderId}
                onChange={(e) => {
                  setSelectedFolderId(e.target.value);
                  const found = driveFolders.find((f) => f.id === e.target.value);
                  if (found) setSelectedFolderName(found.name);
                }}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C44341] font-mono cursor-pointer"
              >
                {driveFolders.map((folder) => (
                  <option key={folder.id} value={folder.id} className="bg-neutral-900 text-white">
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
                Belum ada folder kegiatan. Silakan pilih tab <strong>&quot;+ Buat Kegiatan Baru&quot;</strong> di atas.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateNewFolder} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1">
                Tanggal Kegiatan (YYYY-MM-DD):
              </label>
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C44341] font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-mono text-gray-400 mb-1">
                  Nama Kegiatan:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gowes Pagi Cikarang"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C44341]"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingFolder}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-xs font-mono font-bold text-white uppercase tracking-wider transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isCreatingFolder ? "Membuat..." : "Buat Folder"}
              </button>
            </div>
          </form>
        )}

        {selectedFolderId && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">📂</span>
              <span className="text-emerald-300 truncate">
                Target: <strong>Kegiatan / {selectedFolderName || selectedFolderId} / [foto | video]</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyFolderLink}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shadow-sm cursor-pointer ${copiedLink
                    ? "bg-emerald-600 text-white border-emerald-400"
                    : "bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-500/40"
                  }`}
                title="Salin link Google Drive untuk dibagikan ke anggota"
              >
                <span>{copiedLink ? "✓" : "📋"}</span>
                <span>{copiedLink ? "Link Disalin!" : "Salin Link"}</span>
              </button>

              <a
                href={`https://drive.google.com/drive/folders/${selectedFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold transition-all"
              >
                <span>Buka di Drive</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. Drag & Drop File Picker */}
      <div className="bg-black/60 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <h3
          className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>📤</span>
          <span>2. Pilih File Foto & Video</span>
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoadingFiles && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all ${
            isLoadingFiles
              ? "border-blue-400/60 bg-blue-400/5 cursor-wait"
              : dragActive
              ? "border-[#C44341] bg-[#C44341]/10 scale-[1.01] cursor-pointer"
              : "border-white/20 hover:border-white/40 bg-white/5 cursor-pointer"
          }`}
        >
          {/* Input File Tunggal (Foto & Video) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime,.jpg,.jpeg,.png,.heic,.heif,.mp4,.mov,.webm"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isLoadingFiles ? (
            <div className="flex flex-col items-center justify-center gap-3">
              {/* Spinner animasi */}
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" />
              </div>
              <p className="text-sm font-bold text-blue-300">
                Sedang memuat file dari galeri…
              </p>
              <p className="text-xs text-gray-400 font-mono">
                Menyimpan referensi media ke antrean tanpa membebani browser.
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                Harap tunggu sebentar…
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl mx-auto mb-3">
                🚴
              </div>
              <p className="text-sm font-bold text-white mb-1">
                Tarik &amp; Jatuhkan foto atau video ke sini, atau klik untuk memilih file
              </p>
              <p className="text-xs text-gray-400 font-mono">
                Format didukung: <strong>HEIC, JPG, PNG</strong> (Foto max 50MB) dan <strong>MP4, MOV, WebM</strong> (Video tanpa batas).
              </p>
              <p className="text-[11px] text-amber-300/90 font-mono mt-2">
                💡 Foto HEIC dari iPhone akan otomatis dikonversi ke JPG saat upload agar bisa dibuka di Android.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 4. Queue List & Upload Actions */}
      {queue.length > 0 && (
        <div className="bg-black/60 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3
                className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span>📋</span>
                <span>
                  Antrean Upload ({queue.length} file
                  {photoQueueCount > 0 ? ` · ${photoQueueCount} Foto` : ""}
                  {videoQueueCount > 0 ? ` · ${videoQueueCount} Video` : ""}
                  {" · "}
                  {formatBytes(totalQueueBytes)})
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Berhasil: <span className="text-emerald-400 font-bold">{successCount}</span> · Gagal:{" "}
                <span className="text-red-400 font-bold">{failedCount}</span> · Menunggu:{" "}
                <span className="text-gray-300 font-bold">{queue.length - successCount - failedCount}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tombol Tambah File ke Antrean */}
              {!isUploadingActive && (
                <button
                  type="button"
                  onClick={() => !isLoadingFiles && fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Tambah file foto/video ke antrean"
                >
                  <span>➕</span>
                  <span>Tambah File</span>
                </button>
              )}

              {isUploadingActive ? (
                <button
                  type="button"
                  onClick={handleStopUpload}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  ⏹ Hentikan Upload
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startUploadQueue}
                  disabled={!selectedFolderId || isDriveConfigured === false}
                  className="px-5 py-2.5 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#C44341]/40 disabled:opacity-50 cursor-pointer"
                >
                  🚀 Mulai Upload ({queue.length - successCount} File)
                </button>
              )}

              {successCount > 0 && selectedFolderId && (
                <button
                  type="button"
                  onClick={handleCopyFolderLink}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${copiedLink
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : "bg-emerald-950/60 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300"
                    }`}
                  title="Salin link Google Drive untuk dibagikan"
                >
                  <span>{copiedLink ? "✓" : "📋"}</span>
                  <span>{copiedLink ? "Link Disalin!" : "Salin Link Folder"}</span>
                </button>
              )}

              {successCount > 0 && !isUploadingActive && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-gray-300 transition-colors cursor-pointer"
                >
                  Hapus yg Selesai
                </button>
              )}

              {!isUploadingActive && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-xs font-mono text-red-300 transition-colors"
                >
                  Bersihkan Semua
                </button>
              )}
            </div>
          </div>

          {/* Storage Warning if queue exceeds free space */}
          {isStorageWarning && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Peringatan Kuota:</strong> Total antrean ({formatBytes(totalQueueBytes)}) melebihi sisa penyimpanan Google Drive (
                {storageData?.freeBytes !== null && storageData?.freeBytes !== undefined
                  ? formatBytes(storageData.freeBytes)
                  : "0 B"}
                ). Upload mungkin gagal jika kapasitas habis.
              </span>
            </div>
          )}

          {/* Individual Queue Items List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {queue.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-500 font-mono shrink-0">#{idx + 1}</span>
                    <span className="font-bold text-white truncate max-w-[200px] sm:max-w-md">
                      {item.originalFile.name}
                    </span>
                    <span className="text-gray-400 font-mono shrink-0">
                      ({formatBytes(item.totalBytes)})
                    </span>

                    {/* Kind & HEIC Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${item.kind === "video"
                          ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                          : "bg-blue-950 text-blue-300 border border-blue-500/30"
                        }`}
                    >
                      {item.kind}
                    </span>

                    {item.isHeic && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/30 shrink-0">
                        HEIC → JPG
                      </span>
                    )}
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "menunggu" && (
                      <span className="text-gray-400 font-mono text-[11px] px-2 py-0.5 rounded bg-white/5">
                        Menunggu
                      </span>
                    )}

                    {item.status === "mengonversi" && (
                      <span className="text-amber-400 font-mono text-[11px] px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <span>⚙️</span>
                        <span>Mengonversi...</span>
                      </span>
                    )}

                    {item.status === "mengupload" && (
                      <span className="text-sky-300 font-mono text-[11px] px-2 py-0.5 rounded bg-sky-950/50 border border-sky-500/30 flex items-center gap-1 font-bold">
                        <span>⬆️</span>
                        <span>{item.progressPercent}%</span>
                      </span>
                    )}

                    {item.status === "berhasil" && (
                      <span className="text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 flex items-center gap-1 font-bold">
                        <span>✓</span>
                        <span>Berhasil</span>
                      </span>
                    )}

                    {item.status === "gagal" && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-300 font-mono text-[11px] px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30">
                          Gagal
                        </span>
                        {!isUploadingActive && (
                          <button
                            type="button"
                            onClick={() => handleRetrySingle(item.id)}
                            className="px-2 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-[10px] font-mono text-amber-200 transition-colors cursor-pointer"
                          >
                            Coba Lagi
                          </button>
                        )}
                      </div>
                    )}

                    {item.status !== "mengupload" && item.status !== "mengonversi" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-500 hover:text-red-400 p-1 text-xs transition-colors cursor-pointer"
                        title="Hapus dari antrean"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar for Uploading & Converting */}
                {item.status === "mengupload" && (
                  <div className="space-y-1">
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-400 h-full transition-all duration-300"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>{formatBytes(item.uploadedBytes)} dari {formatBytes(item.totalBytes)}</span>
                      <span>Potongan {CHUNK_SIZE / (1024 * 1024)} MB</span>
                    </div>
                  </div>
                )}

                {/* Error detail */}
                {item.error && (
                  <p className="text-[11px] font-mono text-red-400 bg-red-950/30 p-2 rounded-lg border border-red-500/20">
                    Error: {item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
