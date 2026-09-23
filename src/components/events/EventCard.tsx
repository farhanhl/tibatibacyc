"use client";

import React from "react";
import LoadingImage from "@/components/ui/LoadingImage";
import { EventItem } from "@/types/profile";
import Badge from "@/components/ui/Badge";
import { getDaysDifference, formatIndonesianFullDate } from "@/lib/scheduleService";

interface EventCardProps {
  event: EventItem;
  onOpenStory?: (imageSrc: string, eventName: string) => void;
  onOpenPhoto?: (photos: string[] | string, eventName: string) => void;
}

export default function EventCard({
  event,
  onOpenStory,
  onOpenPhoto,
}: EventCardProps) {
  const diffDays = getDaysDifference(event.date);
  const isUpcoming = diffDays >= 0;
  const badgeLabel = isUpcoming ? (event.badge || "Akan Datang") : "Selesai";
  const formattedDate = formatIndonesianFullDate(event.date);
  const mainPhoto = event.photos && event.photos.length > 0 ? event.photos[0] : null;

  return (
    <article className="w-full h-full bg-black/45 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:border-[#C44341] hover:shadow-2xl flex flex-col justify-between group text-white shadow-2xl">
      <div>
        {/* Top Image Preview or Community Logo Fallback */}
        <div
          className={`relative w-full h-48 sm:h-52 bg-black overflow-hidden ${
            mainPhoto ? "cursor-pointer" : ""
          }`}
          onClick={() => {
            if (mainPhoto && onOpenPhoto) {
              onOpenPhoto(event.photos, event.name);
            }
          }}
        >
          {mainPhoto ? (
            <>
              <LoadingImage
                src={mainPhoto}
                alt={`Foto kegiatan ${event.name}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 flex items-center justify-center p-6 border-b border-white/10">
              {/* Subtle background radial glow */}
              <div className="absolute w-32 h-32 bg-[#C44341]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500">
                <LoadingImage
                  src="/images/logo.webp"
                  alt="Logo Tiba-Tiba Cycling"
                  fill
                  className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                  sizes="120px"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none z-10" />
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center z-10">
            <Badge variant={isUpcoming ? "upcoming" : "completed"} size="sm">
              {badgeLabel}
            </Badge>
          </div>

          {/* Photo count indicator if > 1 */}
          {event.photos && event.photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[11px] font-mono text-white flex items-center gap-1 border border-white/20 z-10">
              <svg className="w-3.5 h-3.5 text-[#C44341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {event.photos.length} Foto
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          {/* Date & Time Header */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#C44341] font-semibold mb-2 uppercase tracking-wide">
            <span>📅 {formattedDate}</span>
            <span>•</span>
            <span>⏰ {event.time}</span>
          </div>

          {/* Title */}
          <h3
            className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white leading-snug group-hover:text-[#C44341] transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {event.name}
          </h3>

          {/* Location & details styled matching the checklist box */}
          <div className="mt-4 pt-4 border-t border-white/15 space-y-2 text-xs">
            <div className="flex items-start gap-2.5 bg-black/40 backdrop-blur-xs p-2.5 rounded-md border border-white/10 hover:border-[#C44341] transition-colors">
              <span className="font-semibold text-white shrink-0">📍 Titik Start:</span>
              <span className="text-[#EAE6DD]">{event.startLocation}</span>
            </div>
            {event.distance && (
              <div className="flex items-start gap-2.5 bg-black/40 backdrop-blur-xs p-2.5 rounded-md border border-white/10 hover:border-[#C44341] transition-colors">
                <span className="font-semibold text-white shrink-0">📏 Jarak Rute:</span>
                <span className="text-[#EAE6DD]">{event.distance}</span>
              </div>
            )}
            {event.bikePolicy && (
              <div className="flex items-start gap-2.5 bg-black/40 backdrop-blur-xs p-2.5 rounded-md border border-white/10 hover:border-[#C44341] transition-colors">
                <span className="font-semibold text-white shrink-0">🚲 Ketentuan:</span>
                <span className="text-[#EAE6DD]">{event.bikePolicy}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 flex flex-wrap items-center gap-2.5">
        {event.instastoryImage && onOpenStory && (
          <button
            type="button"
            onClick={() => onOpenStory(event.instastoryImage!, event.name)}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider bg-black/40 hover:bg-[#C44341] text-[#EAE6DD] hover:text-white border border-white/15 hover:border-[#C44341] rounded-md transition-all shadow-md"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Lihat Poster
          </button>
        )}
        {mainPhoto && onOpenPhoto && (
          <button
            type="button"
            onClick={() => onOpenPhoto(event.photos, event.name)}
            aria-label={`Lihat foto ${event.name}`}
            className="cursor-pointer inline-flex items-center justify-center p-2.5 text-xs font-bold bg-black/40 hover:bg-[#C44341] text-[#EAE6DD] hover:text-white rounded-md border border-white/15 hover:border-[#C44341] transition-all shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}
