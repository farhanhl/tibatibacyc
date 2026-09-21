"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { GalleryItem } from "@/types/profile";
import SectionHeading from "@/components/ui/SectionHeading";

interface GallerySectionProps {
  gallery: GalleryItem[];
  onOpenLightbox: (index: number) => void;
}

export default function GallerySection({
  gallery,
  onOpenLightbox,
}: GallerySectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="gallery" className="scroll-mt-16 sm:scroll-mt-20 py-16 sm:py-24 bg-[#0E1426] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 sm:mb-12">
          <SectionHeading
            number="03"
            tag="Dokumentasi & Momen"
            title="Galeri Gowes"
            subtitle="Potret kebersamaan, jalanan pagi Bekasi, dan momen seru peloton Tiba-Tiba Cycling."
            theme="dark"
            className="mb-0"
          />

          {/* Slider Prev / Next Controls */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Geser ke kiri"
              className="p-3 rounded-sm bg-black/60 hover:bg-[#C44341] text-white border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C44341]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Geser ke kanan"
              className="p-3 rounded-sm bg-black/60 hover:bg-[#C44341] text-white border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C44341]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scroll-Snap Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollBehavior: "smooth" }}
        >
          {gallery.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(index)}
              className="snap-start shrink-0 w-[82vw] sm:w-[320px] md:w-[360px] lg:w-[380px] bg-[#000000] border border-white/10 rounded-md overflow-hidden group cursor-pointer hover:border-[#C44341] transition-all"
            >
              {/* Image Box */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-black">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-106 transition-transform duration-300"
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 340px, 380px"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Category Pill */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider bg-[#C44341] text-white rounded-xs">
                    {item.category}
                  </span>
                </div>

                {/* Date */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 text-[11px] font-mono text-[#EAE6DD] bg-black/60 rounded-xs border border-white/10">
                    {item.date}
                  </span>
                </div>
              </div>

              {/* Caption Box */}
              <div className="p-4 sm:p-5">
                <h3
                  className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white group-hover:text-[#C44341] transition-colors line-clamp-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-[#868B96] line-clamp-2 leading-relaxed">
                  {item.caption}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#C44341] font-bold font-mono">
                  <span>Lihat Fullsize</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
