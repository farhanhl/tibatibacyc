import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";
import MerchandiseDetail from "@/components/merchandise/MerchandiseDetail";
import MerchandiseForm from "@/components/merchandise/MerchandiseForm";
import MerchandisePublicOrders from "@/components/merchandise/MerchandisePublicOrders";

const profile = profileData as ProfileData;

export const metadata: Metadata = {
  title: `Pre-Order Official Tactical Vest — ${profile.site.name} Bekasi`,
  description:
    "Pre-Order rompi resmi Tiba-Tiba Cycling Bekasi. Dibuat dengan bahan American Drill, lapisan furing nyaman, reflektor keselamatan depan-belakang, saku colorblock tactical, dan ring gantung utilitas.",
  openGraph: {
    title: `Pre-Order Official Tactical Vest — ${profile.site.name}`,
    description:
      "Rompi sepeda tactical eksklusif Tiba-Tiba Cycling Bekasi. Bahan American Drill, furing dalam, reflektor keselamatan, saku utilitas colorblock. Pre-order sekarang!",
    images: [
      {
        url: "/images/merch/merch.jpeg",
        width: 1024,
        height: 683,
        alt: "Tactical Riding Vest Tiba-Tiba Cycling Bekasi",
      },
    ],
  },
};

export default function MerchandisePage() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#EAE6DD] flex flex-col font-sans selection:bg-[#C44341] selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Back to Home Link & Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none rounded-md"
            aria-label="Kembali ke Beranda"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#C44341] group-hover:text-white text-gray-300 flex items-center justify-center transition-colors text-sm">
              ←
            </span>
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#C44341] bg-black">
              <Image
                src="/images/logo.webp"
                alt={`${profile.site.name} Logo`}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span
                className="text-lg sm:text-xl font-black tracking-tight text-white uppercase leading-none group-hover:text-[#C44341] transition-colors"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {profile.site.name}
              </span>
              <span className="text-[10px] font-mono tracking-wider text-gray-400">
                ← Kembali ke Beranda
              </span>
            </div>
          </Link>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C44341]/15 border border-[#C44341]/40 text-[#C44341] text-xs font-mono font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />
              Pre-Order Open
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 w-full">
        {/* Page Banner Title */}
        <div className="space-y-3 text-center sm:text-left max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">
            <span>👕 Merchandise Resmi Komunitas</span>
            <span>•</span>
            <span className="text-[#C44341]">Batch #1</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.95]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block text-white">Tactical Riding Vest</span>
            <span className="block text-[#C44341]">Tiba-Tiba Cycling</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-medium">
            Wujud identitas dan kekompakan aspal Bekasi. Rompi sepeda multifungsi dengan bahan American Drill, reflektor keselamatan, saku utilitas colorblock, dan kenyamanan furing dalam.
          </p>
        </div>

        {/* Two-Column Grid: Left (Product Breakdown) & Right (Order Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Visuals & Spec Details */}
          <div className="lg:col-span-7 space-y-8">
            <MerchandiseDetail />
          </div>

          {/* Right Column: Pre-Order Form Sticky */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <MerchandiseForm />
          </div>
        </div>

        {/* Bottom Information / FAQ Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#12141A] border border-white/15 space-y-6 mt-12">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#C44341] font-bold uppercase tracking-wider">
              Informasi Pemesanan
            </span>
            <h3
              className="text-2xl font-black uppercase text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Alur & Ketentuan Pre-Order
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
              <span className="text-xl">1️⃣</span>
              <h4 className="text-sm font-bold text-white">Isi Form Pemesanan</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pilih ukuran, furing, dan desain belakang. Begitu formulir dikirim, pesanan langsung tersimpan ke sistem database pre-order.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
              <span className="text-xl">2️⃣</span>
              <h4 className="text-sm font-bold text-white">Pembayaran & Produksi</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pembayaran dilakukan via transfer bank. Begitu kuota minimal tercapai, proses potong kain & produksi rompi segera berjalan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
              <span className="text-xl">3️⃣</span>
              <h4 className="text-sm font-bold text-white">Pengambilan Rompi</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Bisa diambil langsung saat titik kumpul jadwal gowes weekend atau dikirim ke rumah via kurir/ekspedisi.
              </p>
            </div>
          </div>
        </div>

        {/* Live Public Pre-Orders List */}
        <MerchandisePublicOrders />
      </main>

      {/* Page Footer */}
      <footer className="mt-16 border-t border-white/10 bg-black/80 py-8 text-center text-xs text-gray-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {profile.site.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
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
