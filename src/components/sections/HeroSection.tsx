import React from "react";
import Image from "next/image";
import { ProfileData } from "@/types/profile";

interface HeroSectionProps {
  profile: ProfileData;
}

export default function HeroSection({ profile }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-black py-8 sm:py-12"
    >
      {/* Background Image with City Cyclists Artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/hero-bg.webp"
          alt={`${profile.site.name} Bekasi Background Artwork`}
          fill
          sizes="100vw"
          className="object-cover object-[83%_65%] md:object-[center_55%]"
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
        {/* Top Category Badge */}
        <div className="inline-flex items-center justify-center gap-2 mb-4 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg">
          <span className="px-2.5 py-0.5 bg-[#C44341] text-white text-xs font-bold uppercase tracking-widest rounded-full">
            Bekasi Cycling Community
          </span>
          <span className="text-xs font-mono text-[#EAE6DD] font-semibold">
            Est. {profile.site.founded}
          </span>
        </div>

        {/* Huge Centered Headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.95] drop-shadow-md"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {profile.brand.heroTitle}
        </h1>

        {/* Tagline & Subtitle */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center">
          <p
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#C44341] uppercase tracking-tight leading-tight drop-shadow-md"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {profile.brand.tagline}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-bold text-[#EAE6DD] mt-1.5 tracking-wide drop-shadow-sm">
            {profile.brand.heroSubtitle}
          </p>
        </div>

        {/* Description */}
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#EAE6DD] leading-relaxed max-w-2xl font-medium drop-shadow-xs">
          {profile.brand.heroDescription}
        </p>

        {/* Bike Policy Notice - Centered Horizontally & Vertically */}
        <div className="mt-6 px-5 py-2.5 bg-black/50 backdrop-blur-md border border-white/20 rounded-full max-w-xl mx-auto flex items-center justify-center gap-2.5 shadow-lg text-white">
          <span className="text-lg leading-none shrink-0 flex items-center justify-center">🚲</span>
          <p className="text-xs sm:text-sm font-semibold text-[#EAE6DD] leading-tight text-center">
            {profile.brand.bikePolicy}
          </p>
        </div>

        {/* Dual CTAs Centered */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          <a
            href="#events"
            className="inline-flex items-center justify-center px-7 sm:px-9 py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider bg-[#C44341] hover:bg-[#A93434] text-white rounded-sm transition-all shadow-xl hover:shadow-[#C44341]/50 focus:outline-none focus:ring-2 focus:ring-[#C44341]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lihat Kegiatan
          </a>
          <a
            href="#join"
            className="inline-flex items-center justify-center px-7 sm:px-9 py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider bg-white/10 hover:bg-white text-white hover:text-black rounded-sm transition-all border border-white/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white shadow-xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Join Komunitas
          </a>
        </div>
      </div>
    </section>
  );
}
