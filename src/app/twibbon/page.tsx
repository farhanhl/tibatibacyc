import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TwibbonEditor from "@/components/twibbon/TwibbonEditor";
import TwibbonGuide from "@/components/twibbon/TwibbonGuide";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";
import { TwibbonTemplate } from "@/components/twibbon/types";

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
    url: "https://www.tibatibacyc.my.id/twibbon",
    siteName: profile.site.name,
    images: [
      {
        url: "/images/twibbon/twibbon%201.png",
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
    images: ["/images/twibbon/twibbon%201.png"],
  },
  alternates: {
    canonical: "https://www.tibatibacyc.my.id/twibbon",
  },
};

function getTwibbonTemplates(): TwibbonTemplate[] {
  const dirPath = path.join(process.cwd(), "public", "images", "twibbon");
  const thumbDirPath = path.join(dirPath, "thumbnails");

  const defaultTemplate: TwibbonTemplate = {
    id: "twibbon-1",
    name: "Twibbon #1",
    filename: "twibbon 1.png",
    src: "/images/twibbon/twibbon%201.png",
    thumbnailSrc: "/images/twibbon/thumbnails/twibbon%201.webp",
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

      // Format name gracefully, e.g. "twibbon 1" -> "Twibbon #1"
      const cleanName = rawName
        .replace(/^twibbon\s*(\d+)$/i, "Twibbon #$1")
        .replace(/^twibon\s*(\d+)$/i, "Twibbon #$1");

      const id = filename
        .toLowerCase()
        .replace(/\.(png|webp|jpg|jpeg)$/i, "")
        .replace(/[^a-z0-9]/g, "-");

      const baseNameWithoutExt = filename.replace(/\.(png|webp|jpg|jpeg)$/i, "");
      const thumbFilename = `${baseNameWithoutExt}.webp`;
      const thumbFullPath = path.join(thumbDirPath, thumbFilename);
      const thumbnailSrc = fs.existsSync(thumbFullPath)
        ? `/images/twibbon/thumbnails/${encodeURIComponent(thumbFilename)}`
        : `/images/twibbon/${encodeURIComponent(filename)}`;

      return {
        id,
        name: cleanName,
        filename,
        src: `/images/twibbon/${encodeURIComponent(filename)}`,
        thumbnailSrc,
        width,
        height,
        aspectRatio: width / height,
        description: `Frame resmi gowes ${cleanName} Tiba-Tiba Cycling Bekasi`,
      };
    });
  } catch (error) {
    console.error("Gagal membaca folder twibbon:", error);
    return [defaultTemplate];
  }
}

export default function TwibbonPage() {
  const templates = getTwibbonTemplates();

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-[#EAE6DD]">
      <Header profile={profile} />
      <main className="flex-1 w-full">
        <section className="relative">
          <TwibbonEditor templates={templates} />
        </section>
      </main>
      <Footer profile={profile} />
    </div>
  );
}
