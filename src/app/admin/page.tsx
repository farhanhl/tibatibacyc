"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { EventItem } from "@/types/profile";
import {
  formatIndonesianFullDate,
  getDaysDifference,
} from "@/lib/scheduleService";
import {
  getEventsFromDb,
  createEventInDb,
  updateEventInDb,
  deleteEventFromDb,
} from "@/lib/eventsService";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { MerchandiseOrder } from "@/types/merchandise";
import { getMerchandiseOrders } from "@/lib/merchandiseService";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMetricsCards from "@/components/admin/AdminMetricsCards";
import OverviewAdminTab, { DailyStat } from "@/components/admin/OverviewAdminTab";
import EventsAdminTab from "@/components/admin/EventsAdminTab";
import SettingsAdminTab from "@/components/admin/SettingsAdminTab";
import MerchandiseAdminTab from "@/components/admin/MerchandiseAdminTab";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "merchandise" | "settings">("overview");

  // Data States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [merchOrders, setMerchOrders] = useState<MerchandiseOrder[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [totalVisitorsAllTime, setTotalVisitorsAllTime] = useState(0);
  const [totalJoinsAllTime, setTotalJoinsAllTime] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [todayJoins, setTodayJoins] = useState(0);
  const [yesterdayVisitors, setYesterdayVisitors] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Event & Schedule Form State
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
    startCoordinates: { lat: -6.2648671, lng: 107.0169006, name: "Alfamidi depan Tol Bekasi Timur" },
    destinationCoordinates: { lat: 0, lng: 0, name: "" },
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

  // Cek sesi autentikasi server saat halaman dimuat
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            fetchAllDashboardData();
            return;
          }
        }
      } catch (err) {
        console.warn("Gagal cek auth:", err);
      }
      setIsAuthenticated(false);
    }

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
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

      // 1b. Fetch Merchandise Orders
      try {
        const orderList = await getMerchandiseOrders();
        setMerchOrders(orderList);
      } catch (e) {
        console.warn("Gagal memuat merchandise orders:", e);
      }

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
      const allDates = Array.from(
        new Set([...Object.keys(visitorMap), ...Object.keys(joinMap), todayKey])
      ).sort((a, b) => b.localeCompare(a));

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

  // Upload handlers
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

    const diffDays = getDaysDifference(eventFormData.date);
    const isUpcoming = diffDays >= 0;
    const computedStatus: "upcoming" | "completed" = isUpcoming ? "upcoming" : "completed";
    const computedBadge = isUpcoming ? "Akan Datang" : "Selesai";

    const generatedSlug =
      eventFormData.slug.trim() ||
      eventFormData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const dataToSave: Omit<EventItem, "id"> = {
      ...eventFormData,
      slug: generatedSlug,
      status: computedStatus,
      badge: computedBadge,
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
        startCoordinates: { lat: -6.2648671, lng: 107.0169006, name: "Alfamidi depan Tol Bekasi Timur" },
        destinationCoordinates: { lat: 0, lng: 0, name: "" },
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
      startCoordinates:
        item.startCoordinates || { lat: -6.2648671, lng: 107.0169006, name: item.startLocation },
      destinationCoordinates: item.destinationCoordinates || { lat: 0, lng: 0, name: item.name },
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

  const activeUpcomingPopupEvent = events.find((e) => {
    if (e.showPopup === false) return false;
    const diff = getDaysDifference(e.date);
    return diff >= 0 && diff <= 5;
  });

  const formDiffDays = eventFormData.date ? getDaysDifference(eventFormData.date) : 0;
  const isFormDateUpcoming = formDiffDays >= 0;

  const upcomingEventsCount = events.filter((e) => getDaysDifference(e.date) >= 0).length;
  const completedEventsCount = events.filter((e) => getDaysDifference(e.date) < 0).length;

  // Sedang memeriksa autentikasi awal
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen bg-black text-[#EAE6DD] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#C44341] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-gray-400">Memeriksa sesi admin...</p>
        </div>
      </main>
    );
  }

  // Jika belum login
  if (!isAuthenticated) {
    return (
      <AdminLoginForm
        onSuccess={() => {
          setIsAuthenticated(true);
          fetchAllDashboardData();
        }}
      />
    );
  }

  const { todayKey } = getTodayAndYesterdayKeys();

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
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Top Navbar Header */}
        <AdminHeader
          isLoading={isLoading}
          onRefresh={fetchAllDashboardData}
          onLogout={handleLogout}
        />

        {/* Global Alert Notification */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between border ${
              message.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                : "bg-red-950/80 border-red-500/40 text-red-200"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-white cursor-pointer ml-3 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <AdminMetricsCards
          todayVisitors={todayVisitors}
          yesterdayVisitors={yesterdayVisitors}
          totalVisitorsAllTime={totalVisitorsAllTime}
          todayJoins={todayJoins}
          totalJoinsAllTime={totalJoinsAllTime}
          eventsCount={events.length}
          upcomingEventsCount={upcomingEventsCount}
          completedEventsCount={completedEventsCount}
          activeUpcomingPopupEvent={activeUpcomingPopupEvent}
        />

        {/* 4 Unified Navigation Tabs */}
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
            onClick={() => setActiveTab("merchandise")}
            className={`px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === "merchandise"
                ? "border-[#C44341] text-white bg-white/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            👕 Pre-Order Merchandise ({merchOrders.length})
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
          <OverviewAdminTab dailyStats={dailyStats} todayKey={todayKey} />
        )}

        {/* TAB 2: Kelola Kegiatan & Jadwal Gowes */}
        {activeTab === "events" && (
          <EventsAdminTab
            events={events}
            upcomingEventsCount={upcomingEventsCount}
            eventEditingId={eventEditingId}
            eventFormData={eventFormData}
            setEventFormData={setEventFormData}
            isFormDateUpcoming={isFormDateUpcoming}
            isLoading={isLoading}
            isUploadingPhotos={isUploadingPhotos}
            isUploadingStory={isUploadingStory}
            uploadStatusText={uploadStatusText}
            onSaveEvent={handleSaveEvent}
            onCancelEdit={() => {
              setEventEditingId(null);
              setEventFormData({
                name: "",
                slug: "",
                date: "",
                time: "05:30 WIB",
                startLocation: "Alfamidi depan Tol Bekasi Timur",
                startCoordinates: { lat: -6.2648671, lng: 107.0169006, name: "Alfamidi depan Tol Bekasi Timur" },
                destinationCoordinates: { lat: 0, lng: 0, name: "" },
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
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onTogglePopup={handleTogglePopup}
            onUploadPhotos={handleUploadMultiplePhotos}
            onUploadStory={handleUploadStoryImage}
            onRemovePhoto={handleRemovePhoto}
          />
        )}

        {/* TAB 3: Status Sistem & Info */}
        {activeTab === "settings" && <SettingsAdminTab />}

        {/* TAB 4: Kelola Pre-Order Merchandise */}
        {activeTab === "merchandise" && (
          <MerchandiseAdminTab
            orders={merchOrders}
            onRefresh={fetchAllDashboardData}
          />
        )}
      </div>
    </main>
  );
}
