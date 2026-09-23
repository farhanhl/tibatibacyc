"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
} from "firebase/firestore";
import { EventItem } from "@/types/profile";
import {
  formatIndonesianFullDate,
  calculateDaysRemaining,
  getDaysDifference,
} from "@/lib/scheduleService";
import {
  getEventsFromDb,
  createEventInDb,
  updateEventInDb,
  deleteEventFromDb,
} from "@/lib/eventsService";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "tibatiba2026";

interface DailyStat {
  dateKey: string;
  formattedDate: string;
  visitors: number;
  joins: number;
  conversionRate: string;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Active Tab: 'overview' | 'events' | 'settings' (Unified 1-page management)
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "settings">("overview");

  // Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [totalVisitorsAllTime, setTotalVisitorsAllTime] = useState(0);
  const [totalJoinsAllTime, setTotalJoinsAllTime] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [todayJoins, setTodayJoins] = useState(0);
  const [yesterdayVisitors, setYesterdayVisitors] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Event & Schedule Unified Form State
  const [eventEditingId, setEventEditingId] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");

  const [eventFormData, setEventFormData] = useState<Omit<EventItem, "id">>({
    name: "",
    slug: "",
    date: "",
    time: "05:30 WIB",
    startLocation: "Alfamidi depan Tol Bekasi Timur",
    distance: "25 KM",
    bikePolicy: "Semua jenis sepeda boleh ikut",
    notes: "Gowes santai, jangan lupa helm, lampu & uang kopi!",
    joinUrl: "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
    description: "",
    badge: "Akan Datang",
    status: "upcoming",
    showPopup: true,
    photos: [],
    instastoryImage: "",
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      fetchAllDashboardData();
    } else {
      setPinError(true);
    }
  };

  // Helper date keys (Jakarta)
  const getTodayAndYesterdayKeys = () => {
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayKey = jakartaFormatter.format(now);

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayKey = jakartaFormatter.format(yesterdayDate);

    return { todayKey, yesterdayKey };
  };

  const fetchAllDashboardData = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { todayKey, yesterdayKey } = getTodayAndYesterdayKeys();

      // 1. Fetch Events from Firestore
      const eventList = await getEventsFromDb();
      setEvents(eventList);

      // 2. Fetch Visitor Counters
      const snapVisitors = await getDocs(collection(db, "visitor_counters"));
      const visitorMap: Record<string, number> = {};
      let totalV = 0;
      snapVisitors.forEach((doc) => {
        const data = doc.data();
        const count = typeof data.count === "number" ? data.count : 0;
        visitorMap[doc.id] = count;
        totalV += count;
      });

      // 3. Fetch Join Counters
      const snapJoins = await getDocs(collection(db, "join_counters"));
      const joinMap: Record<string, number> = {};
      let totalJ = 0;
      snapJoins.forEach((doc) => {
        const data = doc.data();
        const count = typeof data.count === "number" ? data.count : 0;
        joinMap[doc.id] = count;
        totalJ += count;
      });

      setTotalVisitorsAllTime(totalV);
      setTotalJoinsAllTime(totalJ);
      setTodayVisitors(visitorMap[todayKey] || 0);
      setTodayJoins(joinMap[todayKey] || 0);
      setYesterdayVisitors(visitorMap[yesterdayKey] || 0);

      // 4. Build Daily Stats List
      const allDates = Array.from(new Set([...Object.keys(visitorMap), ...Object.keys(joinMap), todayKey])).sort(
        (a, b) => b.localeCompare(a)
      );

      const stats: DailyStat[] = allDates.map((dateKey) => {
        const v = visitorMap[dateKey] || 0;
        const j = joinMap[dateKey] || 0;
        const rate = v > 0 ? ((j / v) * 100).toFixed(1) + "%" : "0%";
        return {
          dateKey,
          formattedDate: formatIndonesianFullDate(dateKey),
          visitors: v,
          joins: j,
          conversionRate: rate,
        };
      });

      setDailyStats(stats);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal memuat data dashboard: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================================
     UNIFIED EVENT & SCHEDULE HANDLERS
  ========================================================================= */
  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    setUploadStatusText(`Mengupload 0/${files.length} foto...`);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadStatusText(`Mengupload foto ${i + 1} dari ${files.length}...`);
        const url = await uploadImageToCloudinary(files[i]);
        uploadedUrls.push(url);
      }

      setEventFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls],
      }));
      setMessage({
        type: "success",
        text: `✅ Berhasil mengupload ${uploadedUrls.length} foto ke Cloudinary!`,
      });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal mengupload foto: " + err.message });
    } finally {
      setIsUploadingPhotos(false);
      setUploadStatusText("");
      e.target.value = "";
    }
  };

  const handleUploadStoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingStory(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setEventFormData((prev) => ({
        ...prev,
        instastoryImage: url,
      }));
      setMessage({ type: "success", text: "✅ Poster cerita berhasil diupload ke Cloudinary!" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal mengupload poster cerita: " + err.message });
    } finally {
      setIsUploadingStory(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setEventFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.name || !eventFormData.date || !eventFormData.startLocation) {
      setMessage({ type: "error", text: "Harap lengkapi Nama Kegiatan, Tanggal, dan Titik Kumpul." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Hitung status dan badge otomatis berdasarkan tanggal
    const diffDays = getDaysDifference(eventFormData.date);
    const isUpcoming = diffDays >= 0;
    const computedStatus: "upcoming" | "completed" = isUpcoming ? "upcoming" : "completed";
    const computedBadge = isUpcoming ? "Akan Datang" : "Selesai";

    const generatedSlug =
      eventFormData.slug.trim() ||
      eventFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const dataToSave: Omit<EventItem, "id"> = {
      ...eventFormData,
      slug: generatedSlug,
      status: computedStatus,
      badge: computedBadge,
      // Jika tanggal sudah lewat, pop-up otomatis false
      showPopup: isUpcoming ? (eventFormData.showPopup ?? true) : false,
    };

    try {
      if (eventEditingId) {
        await updateEventInDb(eventEditingId, dataToSave);
        setMessage({ type: "success", text: "✅ Kegiatan & jadwal berhasil diperbarui!" });
      } else {
        await createEventInDb(dataToSave);
        setMessage({ type: "success", text: "✅ Kegiatan & jadwal baru berhasil ditambahkan!" });
      }

      setEventEditingId(null);
      setEventFormData({
        name: "",
        slug: "",
        date: "",
        time: "05:30 WIB",
        startLocation: "Alfamidi depan Tol Bekasi Timur",
        distance: "25 KM",
        bikePolicy: "Semua jenis sepeda boleh ikut",
        notes: "Gowes santai, jangan lupa helm, lampu & uang kopi!",
        joinUrl: "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
        description: "",
        badge: "Akan Datang",
        status: "upcoming",
        showPopup: true,
        photos: [],
        instastoryImage: "",
      });

      await fetchAllDashboardData();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal menyimpan kegiatan: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEvent = (item: EventItem) => {
    setEventEditingId(item.id);
    const isUpcoming = getDaysDifference(item.date) >= 0;

    setEventFormData({
      name: item.name,
      slug: item.slug || "",
      date: item.date,
      time: item.time || "05:30 WIB",
      startLocation: item.startLocation,
      distance: item.distance || "25 KM",
      bikePolicy: item.bikePolicy || "Semua jenis sepeda boleh ikut",
      notes: item.notes || "",
      joinUrl: item.joinUrl || "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
      description: item.description || "",
      badge: isUpcoming ? "Akan Datang" : "Selesai",
      status: isUpcoming ? "upcoming" : "completed",
      showPopup: item.showPopup !== false,
      photos: item.photos || [],
      instastoryImage: item.instastoryImage || "",
    });
    setActiveTab("events");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kegiatan ini beserta jadwal dan fotonya?")) return;

    setIsLoading(true);
    try {
      await deleteEventFromDb(id);
      setMessage({ type: "success", text: "🗑️ Kegiatan berhasil dihapus!" });
      await fetchAllDashboardData();
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal menghapus kegiatan: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePopup = async (item: EventItem) => {
    const newPopupState = !(item.showPopup !== false);
    try {
      await updateEventInDb(item.id, {
        showPopup: newPopupState,
      });
      setMessage({
        type: "success",
        text: `🔘 Pengingat Pop-up "${item.name}" diubah menjadi: ${newPopupState ? "AKTIF" : "NONAKTIF"}`,
      });
      await fetchAllDashboardData();
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal mengubah status pop-up: " + err.message });
    }
  };

  // Find next active upcoming ride within H-5 that has showPopup !== false
  const activeUpcomingPopupEvent = events.find((e) => {
    if (e.showPopup === false) return false;
    const diff = getDaysDifference(e.date);
    return diff >= 0 && diff <= 5;
  });

  const formDiffDays = eventFormData.date ? getDaysDifference(eventFormData.date) : 0;
  const isFormDateUpcoming = formDiffDays >= 0;

  // Login PIN Screen
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden">
        {/* Background Wallpaper */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/background/hero-bg.webp"
            alt="Tiba-Tiba Cycling Admin Background"
            fill
            sizes="100vw"
            className="object-cover object-center filter brightness-40 contrast-110"
            priority
          />
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs" />
        </div>

        {/* Login Box */}
        <div className="relative z-10 w-full max-w-md bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#C44341] flex items-center justify-center text-2xl mx-auto shadow-xl">
              🚲
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
              Admin Tiba-Tiba Cycling
            </h1>
            <p className="text-xs text-gray-400 font-mono">Masuk ke Dashboard Pengelola Komunitas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 uppercase mb-1.5">
                Masukkan PIN Admin
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN Admin..."
                className="w-full px-4 py-3 bg-black/70 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] text-sm font-mono"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-1.5 font-medium">
                  ❌ PIN yang Anda masukkan salah. Silakan coba lagi.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#C44341] hover:bg-[#A93434] text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-sm shadow-lg hover:shadow-[#C44341]/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Buka Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Calculate visitor growth compared to yesterday
  const visitorDiff = todayVisitors - yesterdayVisitors;
  const isPositiveGrowth = visitorDiff >= 0;

  const upcomingEventsCount = events.filter((e) => getDaysDifference(e.date) >= 0).length;
  const completedEventsCount = events.filter((e) => getDaysDifference(e.date) < 0).length;

  return (
    <main className="relative min-h-screen bg-black text-[#EAE6DD] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Wallpaper */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/hero-bg.webp"
          alt="Tiba-Tiba Cycling Admin Background"
          fill
          sizes="100vw"
          className="object-cover object-center filter brightness-30 contrast-110"
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Top Navbar Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/55 backdrop-blur-md border border-white/20 p-5 sm:p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#C44341] flex items-center justify-center text-xl text-white shadow-lg shrink-0">
              🚲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  Admin Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">Tiba-Tiba Cycling Community Control Center</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={fetchAllDashboardData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
            >
              <span>🔄</span>
              <span>{isLoading ? "Memuat..." : "Refresh"}</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-xs font-mono font-bold text-white uppercase tracking-wider transition-all shadow-md hover:shadow-[#C44341]/40"
            >
              <span>Lihat Website</span>
              <span>↗</span>
            </Link>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-xs font-mono text-red-300 transition-colors cursor-pointer"
              title="Keluar dari Admin"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium backdrop-blur-md animate-in fade-in duration-300 ${
              message.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                : "bg-red-950/80 border-red-500/50 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pengunjung Hari Ini */}
          <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>PENGUNJUNG HARI INI</span>
              <span className="text-base">👥</span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                {todayVisitors}
              </p>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${isPositiveGrowth ? "text-emerald-400 bg-emerald-950/60" : "text-amber-400 bg-amber-950/60"}`}>
                {isPositiveGrowth ? `+${visitorDiff}` : visitorDiff} vs kemarin ({yesterdayVisitors})
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">Tercatat di bot Telegram</p>
          </div>

          {/* Card 2: Klik Join WhatsApp Hari Ini */}
          <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>KLIK JOIN WA HARI INI</span>
              <span className="text-base">🤝</span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-[#C44341]" style={{ fontFamily: "var(--font-display)" }}>
                {todayJoins}
              </p>
              <span className="text-[11px] font-mono text-gray-300 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                Konversi: {todayVisitors > 0 ? ((todayJoins / todayVisitors) * 100).toFixed(0) + "%" : "0%"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">Total All-Time: {totalJoinsAllTime} klik</p>
          </div>

          {/* Card 3: Total Kegiatan & Jadwal */}
          <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>TOTAL KEGIATAN & JADWAL</span>
              <span className="text-base">🚴</span>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                {events.length}
              </p>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {upcomingEventsCount} Mendatang • {completedEventsCount} Selesai
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">Tersimpan di Firestore Database</p>
          </div>

          {/* Card 4: Status Pop-up Reminder Aktif */}
          <div className="bg-black/55 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>POP-UP PENGINGAT H-5</span>
              <span className="text-base">🔔</span>
            </div>
            <div>
              {activeUpcomingPopupEvent ? (
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C44341] text-white">
                    {calculateDaysRemaining(activeUpcomingPopupEvent.date).label}
                  </span>
                  <p className="text-sm font-bold text-white truncate max-w-[200px]">
                    {activeUpcomingPopupEvent.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                    TIDAK TAMPIL
                  </span>
                  <p className="text-xs text-gray-400 font-mono">Tidak ada jadwal H-5 aktif</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-mono">Hanya muncul di halaman utama</p>
          </div>
        </div>

        {/* 3 Unified Navigation Tabs */}
        <div className="flex flex-wrap border-b border-white/15 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-[#C44341] text-white bg-white/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            📊 Ringkasan Trafik ({dailyStats.length} Hari)
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "events"
                ? "border-[#C44341] text-white bg-white/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            🚴 Kelola Kegiatan & Jadwal Gowes ({events.length})
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "settings"
                ? "border-[#C44341] text-white bg-white/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            ⚙️ Sistem & Info
          </button>
        </div>

        {/* TAB 1: Ringkasan Trafik */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase text-white" style={{ fontFamily: "var(--font-display)" }}>
                    Riwayat Pengunjung & Konversi Harian
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    Data diambil langsung dari counter database setiap kali ada kunjungan / klik join.
                  </p>
                </div>
              </div>

              {dailyStats.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">
                  Belum ada rekaman statistik trafik.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/15 text-gray-400 uppercase">
                        <th className="py-3 px-4 font-bold">Tanggal</th>
                        <th className="py-3 px-4 font-bold text-center">Pengunjung Web</th>
                        <th className="py-3 px-4 font-bold text-center">Klik Join WhatsApp</th>
                        <th className="py-3 px-4 font-bold text-center">Tingkat Konversi</th>
                        <th className="py-3 px-4 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-gray-200">
                      {dailyStats.map((stat) => {
                        const isToday = stat.dateKey === getTodayAndYesterdayKeys().todayKey;
                        return (
                          <tr key={stat.dateKey} className={isToday ? "bg-[#C44341]/10 font-bold" : "hover:bg-white/5"}>
                            <td className="py-3.5 px-4 text-white">
                              <div className="flex items-center gap-2">
                                {isToday && <span className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />}
                                <span>{stat.formattedDate}</span>
                                {isToday && (
                                  <span className="text-[10px] bg-[#C44341] text-white px-1.5 py-0.5 rounded font-mono uppercase">
                                    Hari Ini
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-sm font-black text-white">{stat.visitors}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="text-sm font-black text-[#C44341]">{stat.joins}</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-xs">
                                {stat.conversionRate}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-[10px] text-gray-400">Tersinkron</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Kelola Kegiatan & Jadwal Gowes (Unified 1-Page) */}
        {activeTab === "events" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            {/* Form Column */}
            <div className="lg:col-span-5 bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-lg font-black uppercase text-white" style={{ fontFamily: "var(--font-display)" }}>
                    {eventEditingId ? "✏️ Edit Kegiatan / Jadwal" : "➕ Tambah Kegiatan / Jadwal Baru"}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-mono">Status otomatis diatur berdasarkan tanggal</p>
                </div>
                {eventEditingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEventEditingId(null);
                      setEventFormData({
                        name: "",
                        slug: "",
                        date: "",
                        time: "05:30 WIB",
                        startLocation: "Alfamidi depan Tol Bekasi Timur",
                        distance: "25 KM",
                        bikePolicy: "Semua jenis sepeda boleh ikut",
                        notes: "Gowes santai, jangan lupa helm, lampu & uang kopi!",
                        joinUrl: "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
                        description: "",
                        badge: "Akan Datang",
                        status: "upcoming",
                        showPopup: true,
                        photos: [],
                        instastoryImage: "",
                      });
                    }}
                    className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 text-xs font-mono">
                {/* Nama Kegiatan */}
                <div>
                  <label className="block text-gray-300 mb-1">NAMA KEGIATAN / DESTINASI GOWES *</label>
                  <input
                    type="text"
                    required
                    value={eventFormData.name}
                    onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                    placeholder="Contoh: Tiba-Tiba ke Kopi Kalean Kebonjati"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
                  />
                </div>

                {/* Tanggal & Waktu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1">TANGGAL GOWES *</label>
                    <input
                      type="date"
                      required
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 min-h-[42px] [color-scheme:dark] bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">JAM KUMPUL</label>
                    <input
                      type="text"
                      value={eventFormData.time}
                      onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                      placeholder="05:30 WIB"
                      className="w-full px-3.5 py-2.5 min-h-[42px] bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
                    />
                  </div>
                </div>

                {/* Status Otomatis Info Box */}
                {eventFormData.date && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-gray-300">Status & Label Kegiatan:</span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        isFormDateUpcoming
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {isFormDateUpcoming ? "● Otomatis: Akan Datang" : "○ Otomatis: Selesai"}
                    </span>
                  </div>
                )}

                {/* Titik Start & Jarak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1">TITIK KUMPUL (START) *</label>
                    <input
                      type="text"
                      required
                      value={eventFormData.startLocation}
                      onChange={(e) => setEventFormData({ ...eventFormData, startLocation: e.target.value })}
                      placeholder="Alfamidi Bekasi Timur"
                      className="w-full px-3.5 py-2.5 min-h-[42px] bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">JARAK TEMPUH</label>
                    <input
                      type="text"
                      value={eventFormData.distance}
                      onChange={(e) => setEventFormData({ ...eventFormData, distance: e.target.value })}
                      placeholder="25 KM"
                      className="w-full px-3.5 py-2.5 min-h-[42px] bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
                    />
                  </div>
                </div>

                {/* Ketentuan Sepeda */}
                <div>
                  <label className="block text-gray-300 mb-1">KETENTUAN SEPEDA</label>
                  <input
                    type="text"
                    value={eventFormData.bikePolicy}
                    onChange={(e) => setEventFormData({ ...eventFormData, bikePolicy: e.target.value })}
                    placeholder="Semua jenis sepeda boleh ikut"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                  />
                </div>

                {/* Catatan / Tips Gowes */}
                <div>
                  <label className="block text-gray-300 mb-1">CATATAN / TIPS GOWES</label>
                  <textarea
                    rows={2}
                    value={eventFormData.notes}
                    onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                    placeholder="Gowes santai, bawa helm, uang kopi & lampu..."
                    className="w-full px-3.5 py-2 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                  />
                </div>

                {/* Toggle Pengingat Pop-up H-5 (Hanya muncul jika tanggal kegiatan di masa depan / hari ini) */}
                {isFormDateUpcoming ? (
                  <div className="flex items-center justify-between p-3.5 bg-black/60 rounded-xl border border-[#C44341]/40">
                    <div>
                      <span className="text-white font-bold block flex items-center gap-1.5">
                        <span>🔔</span>
                        <span>Tampilkan Pop-up Pengingat H-5?</span>
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Akan muncul di beranda saat masuk H-5 menuju tanggal gowes
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eventFormData.showPopup !== false}
                        onChange={(e) => setEventFormData({ ...eventFormData, showPopup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C44341]"></div>
                    </label>
                  </div>
                ) : (
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-[11px] text-gray-400">
                    ℹ️ Pengaturan pop-up dinonaktifkan karena tanggal kegiatan sudah lewat (selesai).
                  </div>
                )}

                {/* UPLOAD FOTO DOKUMENTASI (CLOUDINARY) */}
                <div className="p-4 rounded-xl bg-black/70 border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-200 font-bold block">📸 Foto Dokumentasi Ride</span>
                      <span className="text-[11px] text-gray-400">Upload beberapa foto sekaligus ke Cloudinary</span>
                    </div>
                    {isUploadingPhotos && (
                      <span className="text-[11px] text-[#C44341] font-bold animate-pulse">
                        {uploadStatusText || "Mengupload..."}
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingPhotos}
                    onChange={handleUploadMultiplePhotos}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#C44341] file:text-white hover:file:bg-[#A93434] file:cursor-pointer cursor-pointer"
                  />

                  {/* Previews of Uploaded Photos */}
                  {eventFormData.photos.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] text-gray-400 font-mono">
                        Foto tersimpan ({eventFormData.photos.length}):
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {eventFormData.photos.map((photoUrl, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/20 aspect-video bg-black">
                            <Image
                              src={photoUrl}
                              alt={`Foto ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-md text-[10px] opacity-90 hover:opacity-100 cursor-pointer shadow-md"
                              title="Hapus foto ini"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* UPLOAD POSTER / INSTASTORY */}
                <div className="p-4 rounded-xl bg-black/70 border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-200 font-bold block">📱 Poster Cerita (Instastory)</span>
                      <span className="text-[11px] text-gray-400">Opsional untuk modal poster cerita</span>
                    </div>
                    {isUploadingStory && (
                      <span className="text-[11px] text-[#C44341] font-bold animate-pulse">
                        Mengupload poster...
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingStory}
                    onChange={handleUploadStoryImage}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
                  />

                  {eventFormData.instastoryImage && (
                    <div className="relative inline-block rounded-lg overflow-hidden border border-white/20 w-24 h-36 bg-black mt-2">
                      <Image
                        src={eventFormData.instastoryImage}
                        alt="Poster cerita"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      <button
                        type="button"
                        onClick={() => setEventFormData({ ...eventFormData, instastoryImage: "" })}
                        className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-md text-[10px] cursor-pointer shadow-md"
                        title="Hapus poster ini"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isUploadingPhotos || isUploadingStory}
                  className="w-full py-3.5 bg-[#C44341] hover:bg-[#A93434] disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg hover:shadow-[#C44341]/50"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {isLoading ? "Menyimpan..." : eventEditingId ? "Simpan Perubahan Kegiatan" : "Publikasikan Kegiatan & Jadwal"}
                </button>
              </form>
            </div>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-lg font-black uppercase text-white" style={{ fontFamily: "var(--font-display)" }}>
                  📋 Daftar Seluruh Kegiatan & Jadwal ({events.length})
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  Kegiatan mendatang ({upcomingEventsCount}) otomatis menampilkan opsi pop-up reminder
                </p>
              </div>

              {events.length === 0 ? (
                <div className="p-10 bg-black/55 backdrop-blur-md rounded-2xl border border-white/20 text-center space-y-3">
                  <div className="text-3xl">🚴‍♂️</div>
                  <p className="text-base text-gray-200 font-bold">Belum ada kegiatan tersimpan di database</p>
                  <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">
                    Gunakan formulir di samping untuk menambahkan jadwal gowes atau kegiatan pertama Anda.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1">
                  {events
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((item) => {
                      const diffDays = getDaysDifference(item.date);
                      const isUpcoming = diffDays >= 0;
                      const countdown = calculateDaysRemaining(item.date);
                      const fullDate = formatIndonesianFullDate(item.date);
                      const thumbnail = item.photos && item.photos.length > 0 ? item.photos[0] : null;
                      const isPopupActive = isUpcoming && item.showPopup !== false;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border backdrop-blur-md transition-all space-y-3 ${
                            isUpcoming
                              ? "bg-black/65 border-[#C44341]/60 shadow-xl"
                              : "bg-black/40 border-white/10 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Thumbnail */}
                            {thumbnail ? (
                              <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-black">
                                <Image
                                  src={thumbnail}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="96px"
                                />
                                {item.photos.length > 1 && (
                                  <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white border border-white/20">
                                    +{item.photos.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center text-xl text-gray-500 shrink-0">
                                📸
                              </div>
                            )}

                            {/* Info */}
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white uppercase ${countdown.badgeColor}`}
                                >
                                  {countdown.label}
                                </span>

                                {isUpcoming && (
                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                      isPopupActive
                                        ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300"
                                        : "bg-gray-800 text-gray-400"
                                    }`}
                                  >
                                    {isPopupActive ? "● POP-UP AKTIF" : "○ POP-UP MATI"}
                                  </span>
                                )}

                                <span className="text-[10px] font-mono text-gray-400">
                                  {item.photos?.length || 0} Foto
                                </span>
                              </div>

                              <h3
                                className="text-base font-black uppercase text-white truncate"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {item.name}
                              </h3>

                              <p className="text-xs text-gray-300 font-mono">
                                📅 {fullDate} • {item.time}
                              </p>
                              <p className="text-xs text-gray-400 font-mono truncate">
                                📍 {item.startLocation} {item.distance ? `(${item.distance})` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
                            <div>
                              {isUpcoming ? (
                                <button
                                  onClick={() => handleTogglePopup(item)}
                                  title="Nyalakan / Matikan Pop-up Pengingat H-5 di Beranda"
                                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                    isPopupActive
                                      ? "bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30"
                                      : "bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10"
                                  }`}
                                >
                                  {isPopupActive ? "Matikan Pop-up" : "Aktifkan Pop-up"}
                                </button>
                              ) : (
                                <span className="text-gray-500 text-[11px] italic">
                                  Kegiatan telah selesai
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditEvent(item)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteEvent(item.id)}
                                className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Sistem & Pengaturan */}
        {activeTab === "settings" && (
          <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black uppercase text-white" style={{ fontFamily: "var(--font-display)" }}>
                ⚙️ Status Koneksi & Konfigurasi Sistem
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Informasi layanan pihak ketiga yang terhubung ke website Tiba-Tiba Cycling.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Box 1: Bot Telegram */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
                <div className="flex items-center justify-between text-gray-300 font-bold">
                  <span>🤖 BOT TELEGRAM NOTIFIKASI</span>
                  <span className="text-emerald-400">● TERHUBUNG</span>
                </div>
                <p className="text-gray-400">
                  Mengirim notifikasi otomatis saat ada pengunjung baru dan saat tombol Join WhatsApp diklik.
                </p>
                <div className="pt-2 text-[11px] text-gray-500 space-y-0.5">
                  <p>Target Chat ID: 7101696494</p>
                </div>
              </div>

              {/* Box 2: Database Online */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
                <div className="flex items-center justify-between text-gray-300 font-bold">
                  <span>🗄️ DATABASE ONLINE (FIRESTORE)</span>
                  <span className="text-emerald-400">● TERHUBUNG</span>
                </div>
                <p className="text-gray-400">
                  Satu sistem database terpadu untuk kegiatan ride, foto, dan pengingat pop-up otomatis.
                </p>
                <div className="pt-2 text-[11px] text-gray-500 space-y-0.5">
                  <p>Collections: events, visitor_counters, join_counters</p>
                </div>
              </div>

              {/* Box 3: Cloudinary Media Storage */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
                <div className="flex items-center justify-between text-gray-300 font-bold">
                  <span>☁️ PENYIMPANAN FOTO (CLOUDINARY)</span>
                  <span className="text-emerald-400">● TERHUBUNG</span>
                </div>
                <p className="text-gray-400">
                  Penyimpanan foto dokumentasi dan poster instastory gratis & cepat langsung dari form admin.
                </p>
                <div className="pt-2 text-[11px] text-gray-500 space-y-0.5">
                  <p>Cloud Name: qxwi3ibh</p>
                  <p>Preset: tibatiba_preset</p>
                </div>
              </div>

              {/* Box 4: Keamanan Admin */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/15 space-y-2">
                <div className="flex items-center justify-between text-gray-300 font-bold">
                  <span>🔐 KEAMANAN ADMIN</span>
                  <span className="text-emerald-400">● TERLINDUNGI PIN</span>
                </div>
                <p className="text-gray-400">
                  Akses ke dashboard pengelola diamankan dengan PIN rahasia admin.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
