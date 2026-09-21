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
      aria-label={`Poster Instagram Story: ${eventName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close Button Header */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Story Poster"
          className="p-2.5 bg-black/70 hover:bg-[#C44341] text-white rounded-sm border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C44341]"
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

      {/* Story Poster Container - Strict 9:16 Aspect Ratio */}
      <div className="relative w-full max-w-[380px] h-[82vh] max-h-[680px] flex flex-col items-center justify-center">
        <div className="relative w-full h-full rounded-md overflow-hidden shadow-2xl border border-white/15 bg-black">
          <LoadingImage
            src={imageSrc}
            alt={`Poster Instagram Story - ${eventName}`}
            fill
            className="object-contain sm:object-cover"
            sizes="380px"
            priority
          />
        </div>
        <div className="mt-3 text-center">
          <p
            className="text-white text-xs sm:text-sm font-semibold uppercase tracking-wider font-mono text-[#EAE6DD]"
          >
            Poster Story • {eventName}
          </p>
        </div>
      </div>
    </div>
  );
}
