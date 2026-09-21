"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";

export interface LightboxImage {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  category?: string;
}

interface LightboxProps {
  isOpen: boolean;
  images: LightboxImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  isOpen,
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasMultiple) {
        onNavigate((currentIndex - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight" && hasMultiple) {
        onNavigate((currentIndex + 1) % images.length);
      }
    },
    [isOpen, hasMultiple, currentIndex, images.length, onClose, onNavigate]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar: Counter & Close button */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20 pointer-events-none">
        <div className="pointer-events-auto bg-black/60 px-3 py-1.5 rounded-sm border border-white/10 text-xs sm:text-sm font-mono tracking-widest text-[#EAE6DD]">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Lightbox (Esc)"
          className="pointer-events-auto p-2.5 bg-black/60 hover:bg-[#C44341] text-white rounded-sm border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C44341]"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Prev Button */}
      {hasMultiple && (
        <button
          type="button"
          aria-label="Previous Image (Left Arrow)"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((currentIndex - 1 + images.length) % images.length);
          }}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/70 hover:bg-[#C44341] text-white rounded-sm border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C44341]"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Main Image Container (Forced 3:4 Aspect Ratio with Slider) */}
      <div className="relative w-full max-w-lg flex flex-col items-center justify-center">
        <div className="relative w-full aspect-[3/4] max-h-[70vh] rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-black group">
          <Image
            src={currentImage.src}
            alt={currentImage.alt || currentImage.title || "Tiba-Tiba Cycling Gallery"}
            fill
            className="object-cover object-center transition-all duration-300"
            sizes="(max-width: 768px) 90vw, 540px"
            priority
          />

          {/* Overlaid Image Slide Arrows */}
          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label="Foto Sebelumnya"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate((currentIndex - 1 + images.length) % images.length);
                }}
                className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-black/60 hover:bg-[#C44341] text-white rounded-full border border-white/20 backdrop-blur-md transition-all shadow-lg hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Foto Berikutnya"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate((currentIndex + 1) % images.length);
                }}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-black/60 hover:bg-[#C44341] text-white rounded-full border border-white/20 backdrop-blur-md transition-all shadow-lg hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Badge count on image */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono font-bold text-white border border-white/20 shadow-md">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Slider Strip for Multiple Photos */}
        {hasMultiple && (
          <div className="mt-3 flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar py-1 max-w-full">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(idx);
                }}
                aria-label={`Lihat foto ${idx + 1}`}
                className={`cursor-pointer relative w-12 h-16 rounded-md overflow-hidden transition-all duration-200 shrink-0 ${
                  idx === currentIndex
                    ? "border-2 border-[#C44341] scale-105 shadow-lg shadow-[#C44341]/30"
                    : "border border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                }`}
              >
                <Image
                  src={img.src}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Caption info below image */}
        {(currentImage.title || currentImage.caption) && (
          <div className="mt-2.5 text-center max-w-md w-full px-4 py-2 bg-black/60 backdrop-blur-md rounded-md border border-white/15 shadow-xl">
            {currentImage.title && (
              <h3 className="text-white font-bold text-sm sm:text-base uppercase tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                {currentImage.title}
              </h3>
            )}
            {currentImage.caption && (
              <p className="text-xs sm:text-sm text-[#EAE6DD] mt-0.5 line-clamp-2 font-medium">
                {currentImage.caption}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next Button */}
      {hasMultiple && (
        <button
          type="button"
          aria-label="Next Image (Right Arrow)"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((currentIndex + 1) % images.length);
          }}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/70 hover:bg-[#C44341] text-white rounded-sm border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C44341]"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
