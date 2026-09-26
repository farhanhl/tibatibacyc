"use client";

import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { EventItem } from "@/types/profile";

// Dynamically import map component with ssr: false to avoid window is not defined error
const CyclingRouteMap = dynamic(
  () => import("@/components/map/CyclingRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl flex flex-col items-center justify-center space-y-4 p-8 animate-pulse">
        <div className="relative w-16 h-16 animate-bounce">
          <Image
            src="/images/cyclist.png"
            alt="Memuat Peta Gowes..."
            fill
            sizes="64px"
            className="object-contain"
          />
        </div>
        <div className="text-center space-y-1">
          <p
            className="text-white font-black uppercase text-base tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Memuat Peta Rute Gowes...
          </p>
          <p className="text-xs text-gray-400 font-mono">
            Sinkronisasi data destinasi dan waypoint rute kegiatan
          </p>
        </div>
      </div>
    ),
  }
);

interface RouteMapSectionProps {
  events: EventItem[];
  isLoading?: boolean;
  onOpenPhoto?: (photos: string[] | string, title: string) => void;
  onOpenStory?: (imageSrc: string, title: string) => void;
}

export default function RouteMapSection({
  events,
  isLoading = false,
  onOpenPhoto,
  onOpenStory,
}: RouteMapSectionProps) {
  return (
    <section
      id="route-map"
      className="scroll-mt-16 sm:scroll-mt-20 relative py-12 sm:py-16 md:py-20 bg-black overflow-hidden"
    >
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/activity-bg.webp"
          alt="Peta Rute Tiba-Tiba Cycling"
          fill
          sizes="100vw"
          className="object-cover object-[center_35%] filter brightness-25 contrast-125"
        />
        {/* Dark Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 space-y-2 sm:space-y-3">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between">
          <SectionHeading
            number="04"
            tag="Peta & Navigasi Gowes"
            title="Eksplor Rute Destinasi"
            subtitle="Lihat simulasi pesepeda yang gowes menyusuri rute dari titik kumpul ke berbagai destinasi kegiatan akhir pekan."
            theme="dark"
            subtitleClassName="text-white font-medium"
            className="!mb-1 sm:!mb-2"
          />
        </div>

        {/* Interactive Map Component */}
        {isLoading ? (
          <div className="w-full h-[520px] bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl flex flex-col items-center justify-center space-y-4 p-8 animate-pulse">
            <div className="relative w-16 h-16 animate-bounce">
              <Image
                src="/images/cyclist.png"
                alt="Memuat Peta..."
                fill
                sizes="64px"
                className="object-contain"
              />
            </div>
            <p className="text-xs text-gray-400 font-mono">Mengambil data kegiatan...</p>
          </div>
        ) : (
          <CyclingRouteMap
            events={events}
            onOpenPhoto={onOpenPhoto}
            onOpenStory={onOpenStory}
          />
        )}
      </div>
    </section>
  );
}
