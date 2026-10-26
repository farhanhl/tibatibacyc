"use client";

import React, { useEffect, useCallback } from "react";
import LoadingImage from "@/components/ui/LoadingImage";

interface EventStoryModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  eventName: string;
  onClose: () => void;
}

export default function EventStoryModal({
  isOpen,
  imageSrc,
  eventName,
  onClose,
}: EventStoryModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
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

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Poster kegiatan: ${eventName}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Top Action Buttons (Close & View Original in New Tab) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {imageSrc && (
          <a
            href={imageSrc}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka poster resolusi penuh di tab baru"
            className="cursor-pointer p-2.5 bg-black/70 hover:bg-[#C44341] text-white rounded-lg border border-white/15 transition-all shadow-lg hover:scale-105 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Poster"
          className="cursor-pointer p-2.5 bg-black/70 hover:bg-[#C44341] text-white rounded-lg border border-white/15 transition-all shadow-lg hover:scale-105 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5"
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

      {/* Main Poster Container - Strict 9:16 Aspect Ratio */}
      <div className="relative z-10 flex flex-col items-center justify-center max-h-[96vh] max-w-full">
        {/* Strict 9:16 Frame */}
        <div
          className="relative aspect-[9/16] h-[min(80vh,760px)] w-auto max-w-[calc(100vw-2.5rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-950 flex items-center justify-center shrink-0 ring-1 ring-white/10"
          style={{ aspectRatio: "9 / 16" }}
        >
          <LoadingImage
            src={imageSrc}
            alt={`Poster kegiatan ${eventName}`}
            fill
            className="object-contain"
            sizes="(max-height: 760px) 430px, 90vw"
            priority
          />
        </div>

        {/* Caption & Metadata below frame */}
        <div className="mt-2.5 text-center px-4 max-w-xs sm:max-w-md">
          <p
            className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-[#EAE6DD] truncate"
            title={eventName}
          >
            {eventName}
          </p>
        </div>
      </div>
    </div>
  );
}
