import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";
import { listDriveKegiatanFolders, DriveFolderItem } from "@/lib/googleDriveService";
import DokumentasiClientView from "@/components/dokumentasi/DokumentasiClientView";

const profile = profileData as ProfileData;

// Revalidasi setiap 60 detik (ISR) agar selalu update tanpa membebani limit API
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Arsip Dokumentasi Gowes — ${profile.site.name} Bekasi`,
  description: `Koleksi foto dan video dokumentasi kegiatan gowes bersama ${profile.site.name} Bekasi. Tersimpan rapi di Google Drive dan dapat diakses bebas oleh seluruh anggota.`,
  openGraph: {
    title: `Arsip Dokumentasi Gowes — ${profile.site.name}`,
    description: `Koleksi foto dan video dokumentasi kegiatan gowes bersama ${profile.site.name} Bekasi di Google Drive.`,
    url: "https://www.tibatibacyc.my.id/dokumentasi",
    siteName: profile.site.name,
  },
  alternates: {
    canonical: "https://www.tibatibacyc.my.id/dokumentasi",
  },
};

export default async function DokumentasiPage() {
  let folders: DriveFolderItem[] = [];
  let errorMessage: string | null = null;

  try {
    folders = await listDriveKegiatanFolders();
  } catch (err: unknown) {
    console.error("Gagal memuat folder dokumentasi publik:", err);
    errorMessage =
      err instanceof Error
        ? err.message
        : "Gagal menghubungkan ke Google Drive. Silakan coba muat ulang beberapa saat lagi.";
  }

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-[#EAE6DD] flex flex-col font-sans selection:bg-[#C44341] selection:text-white">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C44341] flex items-center justify-center text-xl text-white shadow-lg group-hover:bg-[#A93434] transition-colors">
              🚲
            </div>
            <div>
              <div
                className="text-lg sm:text-xl font-black uppercase text-white tracking-tight leading-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {profile.site.name}
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                Dokumentasi Kegiatan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors"
            >
              ← Kembali ke Beranda
            </Link>

            <a
              href={profile.community.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 transition-colors"
            >
              <span>💬</span>
              <span>Grup WA</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Hero Section Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
            <span className="w-2 h-2 rounded-full bg-[#C44341] animate-pulse"></span>
            <span>Arsip Google Drive Resmi</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dokumentasi Gowes
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl font-mono">
            Kumpulan arsip foto dan video dari setiap rute gowes bersama Tiba-Tiba Cycling. Silakan cari kegiatan dan buka folder Google Drive untuk mengunduh dokumentasi Anda.
          </p>
        </div>

        {/* Read-Only Interactive List View */}
        <DokumentasiClientView initialFolders={folders} error={errorMessage} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-black/80 py-8 text-center text-xs text-gray-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {profile.site.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <a
              href={profile.community.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C44341] hover:underline"
            >
              Grup WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

