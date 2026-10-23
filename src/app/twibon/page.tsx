import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TwibbonEditor from "@/components/twibon/TwibbonEditor";
import TwibbonGuide from "@/components/twibon/TwibbonGuide";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";
import { TwibbonTemplate } from "@/components/twibon/types";

const profile = profileData as ProfileData;

export const metadata: Metadata = {
  title: `Twibbon Resmi — ${profile.site.name} Bekasi`,
  description: `Gunakan bingkai twibbon resmi ${profile.site.name} Bekasi. Upload fotomu, atur posisi, perbesar / perkecil (zoom), rotasi, dan unduh kualitas HD gratis.`,
  keywords: [
    "Twibbon Tiba-Tiba Cycling",
    "Twibbon Gowes Bekasi",
    "Twibbon Komunitas Sepeda",
    "Twibbon Sepeda Bekasi",
    "Frame Gowes",
    "Twibbon Instagram Story",
    "Gowes Bekasi",
  ],
  openGraph: {
    title: `Twibbon Resmi — ${profile.site.name}`,
    description: `Pasang fotomu di bingkai twibbon resmi ${profile.site.name} Bekasi. Kualitas HD & gratis!`,
    url: "https://www.tibatibacyc.my.id/twibon",
    siteName: profile.site.name,
    images: [
      {
        url: "/images/twibon/twibon%201.png",
        width: 941,
        height: 1672,
        alt: `Twibbon Resmi ${profile.site.name}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Twibbon Resmi — ${profile.site.name}`,
    description: `Pasang fotomu di bingkai twibbon resmi ${profile.site.name} Bekasi.`,
    images: ["/images/twibon/twibon%201.png"],
  },
  alternates: {
    canonical: "https://www.tibatibacyc.my.id/twibon",
  },
};

function getTwibbonTemplates(): TwibbonTemplate[] {
  const dirPath = path.join(process.cwd(), "public", "images", "twibon");

  const defaultTemplate: TwibbonTemplate = {
    id: "twibon-1",
    name: "Twibbon #1",
    filename: "twibon 1.png",
    src: "/images/twibon/twibon%201.png",
    width: 941,
    height: 1672,
    aspectRatio: 941 / 1672,
    description: "Frame resmi gowes akhir pekan Tiba-Tiba Cycling Bekasi",
  };

  try {
    if (!fs.existsSync(dirPath)) {
      return [defaultTemplate];
    }

    const files = fs.readdirSync(dirPath);
    const imageFiles = files
      .filter((f) => /\.(png|webp|jpg|jpeg)$/i.test(f))
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );

    if (imageFiles.length === 0) {
      return [defaultTemplate];
    }

    return imageFiles.map((filename) => {
      let width = 941;
      let height = 1672;

      try {
        const fullPath = path.join(dirPath, filename);
        const buf = fs.readFileSync(fullPath);
        // Check PNG Magic Number (89 50 4E 47 0D 0A 1A 0A)
        if (
          buf.length > 24 &&
          buf[0] === 0x89 &&
          buf[1] === 0x50 &&
          buf[2] === 0x4e &&
          buf[3] === 0x47
        ) {
          width = buf.readUInt32BE(16);
          height = buf.readUInt32BE(20);
        }
      } catch {
        // Fallback to default dimensions
      }

      const rawName = filename
        .replace(/\.(png|webp|jpg|jpeg)$/i, "")
        .replace(/[-_]+/g, " ");

      // Format name gracefully, e.g. "twibon 1" -> "Twibbon #1"
      const cleanName = rawName.replace(/^twibon\s*(\d+)$/i, "Twibbon #$1");

      const id = filename
        .toLowerCase()
        .replace(/\.(png|webp|jpg|jpeg)$/i, "")
        .replace(/[^a-z0-9]/g, "-");

      return {
        id,
        name: cleanName,
        filename,
        src: `/images/twibon/${encodeURIComponent(filename)}`,
        width,
        height,
        aspectRatio: width / height,
        description: `Frame resmi gowes ${cleanName} Tiba-Tiba Cycling Bekasi`,
      };
    });
  } catch (error) {
    console.error("Gagal membaca folder twibon:", error);
    return [defaultTemplate];
  }
}

export default function TwibonPage() {
  const templates = getTwibbonTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-[#EAE6DD]">
      {/* Global Header */}
      <Header profile={profile} />

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Hero Section Banner */}
        <section className="relative pt-10 sm:pt-14 pb-8 sm:pb-12 bg-gradient-to-b from-[#0E1426]/70 via-black to-black border-b border-white/10 overflow-hidden">
          {/* Subtle Background Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C44341]/10 blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-mono text-[#868B96] mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#C44341] font-semibold">Twibbon</span>
            </nav>

            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs sm:text-sm font-semibold tracking-wider uppercase font-mono shadow-md mb-4">
                <span className="text-white">TWIBBON GENERATOR TIBA-TIBA CYCLING</span>
              </div>

              {/* Main Heading */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-[1.05]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PASANG TWIBBON <span className="text-[#C44341]">GOWES</span>
              </h1>

              {/* Tagline & Subtitle */}
              <p className="mt-3 text-base sm:text-lg text-[#EAE6DD]/90 max-w-2xl leading-relaxed">
                Tunjukkan semangat bersepedamu bersama <strong className="text-white font-bold">{profile.site.name}</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Twibbon Interactive Workspace */}
        <section className="relative">
          <TwibbonEditor templates={templates} />
        </section>

        {/* Guide & Steps Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <TwibbonGuide />
        </section>
      </main>

      {/* Global Footer */}
      <Footer profile={profile} />
    </div>
  );
}