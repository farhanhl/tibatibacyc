"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { EventItem } from "@/types/profile";
import SectionHeading from "@/components/ui/SectionHeading";
import EventCard from "@/components/events/EventCard";
import { getDaysDifference } from "@/lib/scheduleService";

interface EventsSectionProps {
  events: EventItem[];
  isLoading?: boolean;
  onOpenStory: (imageSrc: string, eventName: string) => void;
  onOpenPhoto: (photos: string[] | string, title: string) => void;
}

export default function EventsSection({
  events,
  isLoading = false,
  onOpenStory,
  onOpenPhoto,
}: EventsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "completed">("all");
  const sliderRef = useRef<HTMLDivElement>(null);

  const filteredEvents = events.filter((event) => {
    if (activeFilter === "all") return true;
    const isUpcoming = getDaysDifference(event.date) >= 0;
    if (activeFilter === "upcoming") return isUpcoming;
    return !isUpcoming;
  });

  const upcomingCount = events.filter((e) => getDaysDifference(e.date) >= 0).length;
  const completedCount = events.filter((e) => getDaysDifference(e.date) < 0).length;

  const handleScrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -380, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 380, behavior: "smooth" });
    }
  };

  return (
    <section
      id="events"
      className="scroll-mt-16 sm:scroll-mt-20 relative py-12 sm:py-16 md:py-20 bg-black overflow-hidden"
    >
      {/* Background Artwork: Activity / Cyclists Gathering */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/activity-bg.webp"
          alt="Kegiatan Tiba-Tiba Cycling Bekasi Community"
          fill
          sizes="100vw"
          className="object-cover object-[center_60%] md:object-[center_50%]"
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header & Filter controls */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2.5 mb-0">
          <SectionHeading
            number="02"
            tag="Aktivitas & Gowes"
            title="Kegiatan Tiba-Tiba Cycling"
            subtitle="Jadwal gowes akhir pekan dan dokumentasi ride seru melintasi rute-rute terbaik di Bekasi."
            theme="dark"
            subtitleClassName="text-white font-medium"
            className="mb-0"
          />

          <div className="flex items-center gap-2 sm:gap-3 self-start md:self-start shrink-0">
            {/* Filter Tabs */}
            <div className="h-9 sm:h-10 flex items-center p-1 bg-black/60 backdrop-blur-md rounded-md border border-white/15">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`cursor-pointer h-full px-2.5 sm:px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center justify-center ${activeFilter === "all"
                  ? "bg-[#C44341] text-white shadow-xs"
                  : "text-[#868B96] hover:text-white hover:bg-white/5"
                  }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                Semua ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("upcoming")}
                className={`cursor-pointer h-full px-2.5 sm:px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center justify-center ${activeFilter === "upcoming"
                  ? "bg-[#C44341] text-white shadow-xs"
                  : "text-[#868B96] hover:text-white hover:bg-white/5"
                  }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                Akan Datang ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("completed")}
                className={`cursor-pointer h-full px-2.5 sm:px-3 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center justify-center ${activeFilter === "completed"
                  ? "bg-[#C44341] text-white shadow-xs"
                  : "text-[#868B96] hover:text-white hover:bg-white/5"
                  }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                Selesai ({completedCount})
              </button>
            </div>

            {/* Slider Arrow Controls (Visible on mobile and desktop) */}
            {filteredEvents.length > 1 && (
              <div className="h-9 sm:h-10 flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-md border border-white/15">
                <button
                  type="button"
                  onClick={handleScrollLeft}
                  aria-label="Geser ke kiri"
                  className="cursor-pointer h-full w-7 sm:w-8 flex items-center justify-center text-white hover:text-[#C44341] hover:bg-white/10 rounded-xs transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleScrollRight}
                  aria-label="Geser ke kanan"
                  className="cursor-pointer h-full w-7 sm:w-8 flex items-center justify-center text-white hover:text-[#C44341] hover:bg-white/10 rounded-xs transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 1-Row Events Horizontal Slider aligned with header padding */}
        {isLoading ? (
          <div className="flex gap-4 sm:gap-6 overflow-hidden pt-0 pb-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[85vw] sm:w-[350px] md:w-[380px] lg:w-[400px] h-96 bg-black/45 backdrop-blur-md border border-white/15 rounded-xl p-6 space-y-4 animate-pulse"
              >
                <div className="w-full h-48 bg-white/10 rounded-lg" />
                <div className="w-1/3 h-4 bg-white/10 rounded" />
                <div className="w-3/4 h-6 bg-white/10 rounded" />
                <div className="w-full h-12 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="relative group/slider">
            <div
              ref={sliderRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pt-0 pb-1.5 items-stretch"
            >
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="snap-start shrink-0 w-[85vw] sm:w-[350px] md:w-[380px] lg:w-[400px] flex"
                >
                  <div className="w-full flex">
                    <EventCard
                      event={event}
                      onOpenStory={onOpenStory}
                      onOpenPhoto={onOpenPhoto}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-black/40 rounded-md border border-dashed border-white/15">
            <p className="text-[#868B96] font-medium text-sm">
              Tidak ada kegiatan pada kategori ini.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
