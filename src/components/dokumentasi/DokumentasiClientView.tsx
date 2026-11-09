"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { DriveFolderItem } from "@/lib/googleDriveService";

interface DokumentasiClientViewProps {
  initialFolders: DriveFolderItem[];
  error?: string | null;
}

// Helper untuk memecah 'YYYY-MM-DD Nama Kegiatan' menjadi tanggal & nama bersih
function parseFolderName(rawName: string) {
  const match = rawName.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
  if (match) {
    const dateStr = match[1];
    const title = match[2] || "Gowes Tiba-Tiba";

    // Format tanggal ke Bahasa Indonesia (contoh: 8 November 2026)
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      const formattedDate = new Intl.DateTimeFormat("id-ID", {
        timeZone: "UTC",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);

      return { dateStr, formattedDate, title, year: String(year) };
    } catch {
      return { dateStr, formattedDate: dateStr, title, year: "Lainnya" };
    }
  }

  return {
    dateStr: "",
    formattedDate: "Dokumentasi Komunitas",
    title: rawName,
    year: "Lainnya",
  };
}

export default function DokumentasiClientView({
  initialFolders,
  error,
}: DokumentasiClientViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (folderId: string) => {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(folderId);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      prompt("Salin link folder Google Drive berikut:", url);
    }
  };

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return initialFolders;
    const q = searchQuery.toLowerCase();
    return initialFolders.filter((f) => {
      const { title, formattedDate, dateStr } = parseFolderName(f.name);
      return (
        f.name.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        formattedDate.toLowerCase().includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [initialFolders, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-black/50 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari dokumentasi gowes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C44341] font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 shrink-0 px-2">
          <span>Menampilkan:</span>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-bold">
            {filteredFolders.length} Kegiatan
          </span>
        </div>
      </div>

      {/* Error Banner jika ada kendala koneksi */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-start gap-2.5">
          <span className="text-base shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">Pemberitahuan:</p>
            <p className="text-gray-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Grid Folder Kegiatan (Read-Only) */}
      {filteredFolders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFolders.map((folder) => {
            const { title, formattedDate, dateStr } = parseFolderName(folder.name);
            const folderDriveUrl = `https://drive.google.com/drive/folders/${folder.id}`;
            const isCopied = copiedId === folder.id;

            return (
              <div
                key={folder.id}
                className="group relative bg-black/60 border border-white/10 hover:border-[#C44341]/60 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-[#C44341]/10 hover:-translate-y-1"
              >
                {/* Top Badge & Date */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                      <span>📁</span>
                      <span>Google Drive</span>
                    </span>

                    {dateStr && (
                      <span className="text-[11px] text-gray-400">
                        {dateStr}
                      </span>
                    )}
                  </div>

                  {/* Title & Indonesian Date */}
                  <div>
                    <h3
                      className="text-lg sm:text-xl font-black uppercase text-white tracking-tight group-hover:text-[#C44341] transition-colors leading-snug line-clamp-2"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      🗓️ {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Subfolder info & Action Buttons */}
                <div className="pt-6 mt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300">
                      📸 Foto
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                      🎬 Video
                    </span>
                  </div>

                  {/* Actions: Open Drive & Copy Link */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={folderDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-md"
                    >
                      <span>Buka Folder</span>
                      <span>↗</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(folder.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${isCopied
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : "bg-white/5 hover:bg-white/15 border-white/15 text-gray-300 hover:text-white"
                        }`}
                      title="Salin link Google Drive untuk dibagikan"
                    >
                      <span>{isCopied ? "✓" : "📋"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-3xl mx-auto">
            🚴
          </div>
          <h3
            className="text-lg font-black uppercase text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {searchQuery ? "Tidak Ada Dokumentasi yang Cocok" : "Belum Ada Dokumentasi"}
          </h3>
          <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">
            {searchQuery
              ? `Tidak ditemukan folder kegiatan dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
              : "Folder kegiatan di Google Drive belum tersedia atau sedang dipersiapkan oleh admin."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      )}
    </div>
  );
}

