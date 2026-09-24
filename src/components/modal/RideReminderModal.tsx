"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { EventItem } from "@/types/profile";
import {
  calculateDaysRemaining,
  formatIndonesianFullDate,
  getDaysDifference,
} from "@/lib/scheduleService";
import {
  getGoogleCalendarUrl,
  downloadIcsCalendar,
  addEventToDeviceCalendar,
  detectDeviceType,
} from "@/lib/calendarService";

export default function RideReminderModal() {
  const pathname = usePathname();
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [calendarSuccessMsg, setCalendarSuccessMsg] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    setDeviceType(detectDeviceType());
  }, []);

  // Hanya izinkan modal aktif di halaman utama ("/")
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;

    let unsubscribe = () => { };

    try {
      const eventsRef = collection(db, "events");

      unsubscribe = onSnapshot(
        eventsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: EventItem[] = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...(doc.data() as Omit<EventItem, "id">) });
            });

            // Filter H-5: hanya kegiatan yang berjarak 0 sampai 5 hari (H-0 s/d H-5) dan showPopup !== false
            const eligibleEvents = list
              .map((ev) => ({
                event: ev,
                diffDays: getDaysDifference(ev.date),
              }))
              .filter(
                (item) =>
                  item.diffDays >= 0 &&
                  item.diffDays <= 5 &&
                  item.event.showPopup !== false
              )
              .sort((a, b) => a.diffDays - b.diffDays); // Urutkan yang paling dekat

            if (eligibleEvents.length > 0) {
              setActiveEvent(eligibleEvents[0].event);
            } else {
              setActiveEvent(null);
            }
          } else {
            setActiveEvent(null);
          }
        },
        (error) => {
          console.warn("Error membaca kegiatan untuk popup:", error);
          setActiveEvent(null);
        }
      );
    } catch {
      setActiveEvent(null);
    }

    return () => unsubscribe();
  }, [isHomePage]);

  // Buka popup otomatis saat kegiatan yang memenuhi syarat ditemukan
  useEffect(() => {
    if (!isHomePage) {
      setIsOpen(false);
      return;
    }

    if (activeEvent && activeEvent.showPopup !== false) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [activeEvent, isHomePage]);

  if (!isHomePage || !activeEvent || activeEvent.showPopup === false || !isOpen) return null;

  const countdown = calculateDaysRemaining(activeEvent.date, activeEvent.time);
  const fullDateIndo = formatIndonesianFullDate(activeEvent.date);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleJoinClick = () => {
    try {
      fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        keepalive: true,
      }).catch(() => { });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop Blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#12141A] border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white z-10 animate-in zoom-in-95 fade-in duration-300">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C44341] via-[#E25C5A] to-[#C44341]" />

        {/* Header Content */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Top Tag & Close Button */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 text-xs font-mono font-bold uppercase tracking-wider">
              <span className={`px-2 py-0.5 rounded-full text-white text-[10px] ${countdown.badgeColor}`}>
                {countdown.label}
              </span>
              <span className="text-gray-300">Jadwal Gowes</span>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Tutup Pengumuman"
            >
              ✕
            </button>
          </div>

          {/* Activity Name */}
          <div className="space-y-1">
            <p className="text-xs font-mono text-[#C44341] font-bold uppercase tracking-wider">
              Kegiatan Mendatang
            </p>
            <h3
              className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {activeEvent.name}
            </h3>
          </div>

          {/* Detail Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Tanggal */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span>📅</span>
                <span>HARI & TANGGAL</span>
              </div>
              <p className="text-sm font-bold text-[#EAE6DD]">{fullDateIndo}</p>
            </div>

            {/* Jam Kumpul */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span>⏰</span>
                <span>WAKTU KUMPUL</span>
              </div>
              <p className="text-sm font-bold text-[#EAE6DD]">{activeEvent.time || "05:30 WIB"}</p>
            </div>

            {/* Titik Start */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1 sm:col-span-2">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span>📍</span>
                <span>TITIK START (MEETING POINT)</span>
              </div>
              <p className="text-sm font-bold text-white">{activeEvent.startLocation}</p>
            </div>

            {/* Jarak Tempuh */}
            {activeEvent.distance && (
              <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                  <span>📏</span>
                  <span>JARAK TEMPUH</span>
                </div>
                <p className="text-sm font-bold text-[#C44341]">{activeEvent.distance}</p>
              </div>
            )}

            {/* Aturan Sepeda */}
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span>🚲</span>
                <span>JENIS SEPEDA</span>
              </div>
              <p className="text-xs font-semibold text-gray-200">
                {activeEvent.bikePolicy || "Semua jenis sepeda boleh"}
              </p>
            </div>
          </div>

          {/* Catatan Tambahan (Notes) */}
          {activeEvent.notes && (
            <div className="p-3 bg-[#C44341]/10 rounded-lg border border-[#C44341]/25 text-xs text-[#EAE6DD] flex items-start gap-2.5">
              <span className="text-sm">💡</span>
              <span className="leading-relaxed">{activeEvent.notes}</span>
            </div>
          )}

          {/* Opsi Tambah ke Kalender HP (Otomatis berdasarkan User Agent & Pilihan Manual) */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const result = addEventToDeviceCalendar(activeEvent);
                  setCalendarSuccessMsg(result.message);
                  setTimeout(() => setCalendarSuccessMsg(null), 4000);
                }}
                className="flex-1 py-2.5 px-3.5 bg-gradient-to-r from-[#1e232f] to-[#141720] hover:from-[#2a3040] hover:to-[#1a1f2c] text-white border border-white/20 hover:border-[#C44341]/60 rounded-xl font-mono text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-sm group"
              >
                <span className="flex items-center gap-2">
                  <span>📅 Pasang Pengingat di Kalender</span>
                </span>
              </button>
            </div>

            {/* Dropdown Options Manual (Fallback / Opsi Tambahan) */}
            {showCalendarMenu && (
              <div className="p-2.5 bg-black/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-mono text-gray-400 px-1 pb-1 border-b border-white/10">
                  Pilih format kalender secara manual:
                </p>
                <a
                  href={getGoogleCalendarUrl(activeEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setShowCalendarMenu(false);
                    setCalendarSuccessMsg("Membuka Google Calendar...");
                    setTimeout(() => setCalendarSuccessMsg(null), 3500);
                  }}
                  className="w-full p-2 rounded-lg bg-white/5 hover:bg-[#C44341]/20 hover:border-[#C44341]/50 border border-transparent text-xs font-mono text-white flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🌐</span>
                    <span>Google Calendar (Android / Gmail)</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">Buka ↗</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    downloadIcsCalendar(activeEvent);
                    setShowCalendarMenu(false);
                    setCalendarSuccessMsg("File jadwal (.ics) diunduh! Buka untuk simpan di Apple Calendar.");
                    setTimeout(() => setCalendarSuccessMsg(null), 4000);
                  }}
                  className="w-full p-2 rounded-lg bg-white/5 hover:bg-[#C44341]/20 hover:border-[#C44341]/50 border border-transparent text-xs font-mono text-white flex items-center justify-between transition-all cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">🍏</span>
                    <span>Apple Calendar / iPhone & Outlook (.ics)</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">Simpan ↓</span>
                </button>
              </div>
            )}

            {calendarSuccessMsg && (
              <p className="text-[11px] font-mono text-emerald-400 text-center animate-in fade-in">
                ✅ {calendarSuccessMsg}
              </p>
            )}
          </div>

          {/* CTA Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <a
              href={activeEvent.joinUrl || "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleJoinClick}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-xs sm:text-sm tracking-wider rounded-xl shadow-lg hover:shadow-[#C44341]/50 transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Gabung</span>
            </a>

            <button
              onClick={handleClose}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
