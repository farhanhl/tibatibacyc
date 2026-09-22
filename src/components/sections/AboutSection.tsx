import React from "react";
import Image from "next/image";
import LoadingImage from "@/components/ui/LoadingImage";
import { ProfileData } from "@/types/profile";
import SectionHeading from "@/components/ui/SectionHeading";

interface AboutSectionProps {
  profile: ProfileData;
}

export default function AboutSection({ profile }: AboutSectionProps) {
  const { about, site } = profile;

  // Custom cycling icons & tags for each pillar
  const pillarExtras = [
    {
      icon: (
        <svg className="w-5 h-5 text-[#C44341] group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="5.5" cy="17.5" r="3.5" strokeWidth="2" />
          <circle cx="18.5" cy="17.5" r="3.5" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3 11.5l3.5-7.5H18M5.5 17.5l4-7.5h5.5l3.5 7.5M9.5 10l2.5-4h3" />
        </svg>
      ),
      badge: "ALL BIKES WELCOME",
      highlight: "Road • Fold • MTB • Gravel",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#C44341] group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      badge: "BEKASI URBAN ROUTES",
      highlight: "Timur • Barat • Selatan",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#C44341] group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
        </svg>
      ),
      badge: "WEEKEND & COFFEE",
      highlight: "Ride • Regroup • Relax",
    },
  ];

  return (
    <section
      id="about"
      className="scroll-mt-16 sm:scroll-mt-20 relative py-16 sm:py-24 overflow-hidden bg-black"
    >
      {/* Background Artwork: Cyclists chatting & resting together */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/about-bg.webp"
          alt="Tentang Tiba-Tiba Cycling Bekasi Community"
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
        {/* Section Heading with Dark Theme */}
        <SectionHeading
          number="01"
          tag="Tentang Komunitas"
          title={about.title}
          subtitle={about.lead}
          theme="dark"
        />

        {/* Cyclist Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8 items-stretch">
          {/* Left Column: Big Peloton Feature Card in Dark Style */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-black/60 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden shadow-2xl group text-white">
            {/* Peloton Action Image with Loading Animation */}
            <div className="relative w-full h-64 sm:h-72 bg-black overflow-hidden">
              <LoadingImage
                src="/images/events/icm-agustus-2026/icm1.webp"
                alt="Peloton Tiba-Tiba Cycling Bekasi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

              {/* Cycling Badge Overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-[#C44341] text-white text-xs font-black uppercase tracking-widest rounded-xs shadow-md font-mono">
                  Peloton Ride
                </span>
                <span className="px-2.5 py-1 bg-black/70 text-[#EAE6DD] text-xs font-mono rounded-xs border border-white/20">
                  Bekasi City
                </span>
              </div>

              {/* Bottom Overlay Label */}
              <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                <p
                  className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Satu Aspal di Kota Patriot
                </p>
              </div>
            </div>

            {/* Story & Philosophy Body */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-base text-[#EAE6DD] leading-relaxed font-normal">
                  {about.description}
                </p>

                {about.extended && (
                  <div className="p-4 bg-[#C44341]/15 rounded-md border-l-4 border-[#C44341] text-sm text-[#EAE6DD] italic leading-relaxed border border-white/5">
                    &ldquo;{about.extended}&rdquo;
                  </div>
                )}
              </div>

              {/* Cycling Area Routes Pill Strip */}
              <div className="pt-4 border-t border-white/15">
                <p className="text-xs font-mono uppercase font-bold text-[#868B96] mb-2.5 tracking-wider">
                  Anggota kita tersebar di:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {site.areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-[#EAE6DD] rounded-sm text-xs font-bold uppercase tracking-wider border border-white/15 hover:border-[#C44341] transition-colors"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C44341]" />
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Cycling Telemetry Stats + 3 Rich Cyclist Cards */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            {/* Top Cyclist HUD / Telemetry Box */}
            <div className="bg-black/65 backdrop-blur-md text-white p-6 rounded-lg border-2 border-[#C44341] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#C44341]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C44341] animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#EAE6DD] font-bold">
                    Community Telemetry
                  </span>
                </div>
                <span className="text-xs font-mono text-[#868B96]">Bekasi, Indonesia</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#868B96] block">Didirikan</span>
                  <span
                    className="text-2xl sm:text-3xl font-black text-white tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {site.founded}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#868B96] block">Coverage</span>
                  <span
                    className="text-2xl sm:text-3xl font-black text-[#C44341] tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    3 Wilayah
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-mono uppercase text-[#868B96] block">Ride Rhythm</span>
                  <span
                    className="text-2xl sm:text-3xl font-black text-white tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Weekend
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Pillar Cards - Pure Cyclist Dark Design */}
            {about.pillars && (
              <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                {about.pillars.map((pillar, idx) => {
                  const extra = pillarExtras[idx] || pillarExtras[0];
                  return (
                    <div
                      key={idx}
                      className="bg-black/55 backdrop-blur-md p-5 sm:p-6 rounded-lg border border-white/15 hover:border-[#C44341] hover:shadow-2xl transition-all duration-200 group relative overflow-hidden text-white"
                    >
                      {/* Left Accent Color Stripe */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C44341] group-hover:w-2 transition-all" />

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 pl-2">
                          {/* Icon Box */}
                          <div className="w-10 h-10 rounded-md bg-[#C44341]/20 border border-[#C44341]/40 flex items-center justify-center shrink-0 group-hover:bg-[#C44341] group-hover:text-white transition-colors">
                            {extra.icon}
                          </div>

                          {/* Content */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C44341] bg-[#C44341]/20 px-2 py-0.5 rounded-xs border border-[#C44341]/30">
                                {extra.badge}
                              </span>
                            </div>
                            <h4
                              className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-[#C44341] transition-colors leading-tight"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {pillar.title}
                            </h4>
                            <p className="mt-1.5 text-xs sm:text-sm text-[#EAE6DD] leading-relaxed">
                              {pillar.description}
                            </p>
                          </div>
                        </div>

                        {/* Big Display Index Number */}
                        <span
                          className="text-3xl sm:text-4xl font-black text-white/20 group-hover:text-[#C44341]/40 transition-colors leading-none font-mono shrink-0 select-none"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          0{idx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
