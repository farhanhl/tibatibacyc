"use client";

import React from "react";
import Image from "next/image";
import { ProfileData } from "@/types/profile";

interface JoinSectionProps {
  community: ProfileData["community"];
  brand: ProfileData["brand"];
}

export default function JoinSection({ community, brand }: JoinSectionProps) {
  const handleJoinClick = () => {
    try {
      fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        keepalive: true,
      }).catch((err) => {
        console.warn("[JoinTracker] Gagal mengirim log join:", err);
      });
    } catch {
      // ignore
    }
  };
  return (
    <section
      id="join"
      className="scroll-mt-16 sm:scroll-mt-20 relative min-h-screen sm:min-h-[105vh] lg:min-h-[110vh] py-32 sm:py-44 md:py-56 flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Immersive Background Artwork (Cyclists waving to invite rider) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/join-bg.webp"
          alt="Join Tiba-Tiba Cycling Bekasi Community"
          fill
          sizes="100vw"
          className="object-cover object-[27%_45%] md:object-[center_40%]"
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Bold Invitation & WhatsApp CTA */}
          <div className="lg:col-span-7 space-y-6 text-white">
            {/* Section 05 Open Member Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold tracking-wider uppercase font-mono shadow-md text-[#EAE6DD]">
              <span className="inline-block px-2 py-0.5 bg-[#C44341] text-white rounded-full font-bold text-[11px] sm:text-xs tracking-normal shadow-xs">
                05
              </span>
              <span className="font-bold tracking-wider">Gabung Komunitas</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C44341] animate-ping ml-0.5" />
            </div>

            {/* Huge Headline */}
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.95] drop-shadow-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {community.heading}
            </h2>

            {/* Tagline Accent */}
            <p
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#C44341] uppercase tracking-tight leading-tight drop-shadow-md"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {community.tagline}
            </p>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#EAE6DD] leading-relaxed max-w-xl font-medium drop-shadow-sm">
              {community.description}
            </p>

            {/* Primary Action Button */}
            <div className="pt-2">
              {community.joinUrl ? (
                <a
                  href={community.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleJoinClick}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-black uppercase tracking-wider bg-[#C44341] hover:bg-[#A93434] text-white rounded-sm shadow-2xl hover:shadow-[#C44341]/60 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white group"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <svg className="w-6 h-6 fill-current text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  {community.joinLabel}
                </a>
              ) : (
                <span className="inline-flex items-center px-6 py-3 bg-[#384359] text-white rounded-sm text-sm font-semibold">
                  Link pendaftaran segera dibuka
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Cyclist Safety Checklist Box with Glassmorphic Transparency */}
          <div className="lg:col-span-5 bg-black/45 backdrop-blur-md p-6 sm:p-8 rounded-xl border border-white/20 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-white/15 pb-3.5">
              <span className="w-8 h-8 rounded-md bg-[#C44341] flex items-center justify-center text-base shadow-sm">
                📋
              </span>
              <div>
                <h3
                  className="text-lg sm:text-xl font-black uppercase tracking-tight text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Panduan & Kesepakatan
                </h3>
              </div>
            </div>

            <ul className="space-y-2.5 pt-1">
              {community.guidelines.map((guideline, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-xs sm:text-sm text-white bg-black/40 backdrop-blur-xs p-2.5 rounded-md border border-white/10 hover:border-[#C44341] transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-[#C44341] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="leading-snug">{guideline}</span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-white/15 flex items-center gap-2 text-xs text-[#EAE6DD] font-mono">
              <span className="text-base">🚲</span>
              <span className="leading-tight">{brand.bikePolicy}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
