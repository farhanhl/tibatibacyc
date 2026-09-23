"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
} from "firebase/firestore";
import { RideSchedule } from "@/types/schedule";
import { formatIndonesianFullDate, calculateDaysRemaining } from "@/lib/scheduleService";

const ADMIN_PIN = "tibatiba2026";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [schedules, setSchedules] = useState<RideSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<RideSchedule, "id">>({
    title: "",
    destination: "",
    date: "",
    time: "05:30 WIB",
    meetingPoint: "Alfamidi depan Tol Bekasi Timur",
    distance: "20 KM",
    bikePolicy: "Semua jenis sepeda boleh ikut",
    notes: "Gowes santai, jangan lupa helm, lampu & uang kopi!",
    joinUrl: "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
    isActive: true,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      fetchSchedules();
    } else {
      setPinError(true);
    }
  };

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "schedules"));
      const snapshot = await getDocs(q);
      const list: RideSchedule[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<RideSchedule, "id">) });
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setSchedules(list);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal mengambil data jadwal: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.meetingPoint) {
      setMessage({ type: "error", text: "Harap isi Judul, Tanggal, dan Titik Kumpul." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      if (editingId) {
        // Update
        const docRef = doc(db, "schedules", editingId);
        await updateDoc(docRef, { ...formData });
        setMessage({ type: "success", text: "✅ Jadwal gowes berhasil diperbarui!" });
      } else {
        // Create new
        await addDoc(collection(db, "schedules"), {
          ...formData,
          createdAt: new Date().toISOString(),
        });
        setMessage({ type: "success", text: "✅ Jadwal gowes baru berhasil ditambahkan!" });
      }

      // Reset form
      setEditingId(null);
      setFormData({
        title: "",
        destination: "",
        date: "",
        time: "05:30 WIB",
        meetingPoint: "Alfamidi depan Tol Bekasi Timur",
        distance: "20 KM",
        bikePolicy: "Semua jenis sepeda boleh ikut",
        notes: "Gowes santai, jangan lupa helm, lampu & uang kopi!",
        joinUrl: "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
        isActive: true,
      });

      await fetchSchedules();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal menyimpan jadwal: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: RideSchedule) => {
    setEditingId(item.id || null);
    setFormData({
      title: item.title,
      destination: item.destination,
      date: item.date,
      time: item.time,
      meetingPoint: item.meetingPoint,
      distance: item.distance,
      bikePolicy: item.bikePolicy || "Semua jenis sepeda boleh ikut",
      notes: item.notes || "",
      joinUrl: item.joinUrl || "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
      isActive: item.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "schedules", id));
      setMessage({ type: "success", text: "🗑️ Jadwal berhasil dihapus!" });
      await fetchSchedules();
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal menghapus jadwal: " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (item: RideSchedule) => {
    if (!item.id) return;
    const newStatus = !item.isActive;
    try {
      const docRef = doc(db, "schedules", item.id);
      await updateDoc(docRef, { isActive: newStatus });
      setMessage({
        type: "success",
        text: `🔘 Status pop-up jadwal "${item.title}" diubah menjadi: ${newStatus ? "AKTIF (Tampil)" : "NONAKTIF (Sembunyi)"}`,
      });
      await fetchSchedules();
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal mengubah status: " + err.message });
    }
  };

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
              🔐
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
              Admin Tiba-Tiba Cycling
            </h1>
            <p className="text-xs text-gray-400 font-mono">Kelola Jadwal & Pop-up Reminder Modal</p>
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
                placeholder="PIN Admin"
                className="w-full px-4 py-3 bg-black/70 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] text-sm"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-1.5 font-medium">
                  ❌ PIN salah.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#C44341] hover:bg-[#A93434] text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-sm shadow-lg hover:shadow-[#C44341]/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Masuk Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black text-[#EAE6DD] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6 bg-black/40 backdrop-blur-md p-6 rounded-2xl border">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Kelola Jadwal & Reminder Gowes
            </h1>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono uppercase text-white transition-colors self-start border border-white/10"
          >
            ← Kembali ke Website
          </a>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium backdrop-blur-md ${message.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : "bg-red-950/80 border-red-500/50 text-red-300"
              }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Input / Edit */}
          <div className="lg:col-span-5 bg-black/75 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-black uppercase text-white" style={{ fontFamily: "var(--font-display)" }}>
                {editingId ? "✏️ Edit Jadwal Gowes" : "➕ Tambah Jadwal Baru"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: "",
                      destination: "",
                      date: "",
                      time: "05:30 WIB",
                      meetingPoint: "Alfamidi depan Tol Bekasi Timur",
                      distance: "20 KM",
                      bikePolicy: "Semua jenis sepeda boleh ikut",
                      notes: "Gowes santai, jangan lupa helm, lampu & uang kopi!",
                      joinUrl: "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
                      isActive: true,
                    });
                  }}
                  className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              {/* Judul & Destinasi */}
              <div>
                <label className="block text-gray-300 mb-1">JUDUL GOWES *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, destination: e.target.value })}
                  placeholder="Contoh: Tiba-Tiba ke Kopi Nako Kota Bintang"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
                />
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">TANGGAL GOWES *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">JAM KUMPUL</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="05:30 WIB"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                  />
                </div>
              </div>

              {/* Titik Kumpul */}
              <div>
                <label className="block text-gray-300 mb-1">TITIK KUMPUL (MEETING POINT) *</label>
                <input
                  type="text"
                  required
                  value={formData.meetingPoint}
                  onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                  placeholder="Contoh: Alfamidi depan Tol Bekasi Timur"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                />
              </div>

              {/* Jarak & Aturan Sepeda */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1">JARAK TEMPUH</label>
                  <input
                    type="text"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    placeholder="27 KM"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">JENIS SEPEDA</label>
                  <input
                    type="text"
                    value={formData.bikePolicy}
                    onChange={(e) => setFormData({ ...formData, bikePolicy: e.target.value })}
                    placeholder="Semua jenis sepeda"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                  />
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-gray-300 mb-1">CATATAN / TIPS</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Gowes santai, bawa helm, uang kopi & lampu..."
                  className="w-full px-3.5 py-2 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
                />
              </div>

              {/* Toggle Aktifkan Pop-up */}
              <div className="flex items-center justify-between p-3.5 bg-black/50 rounded-xl border border-white/15">
                <div>
                  <span className="text-gray-200 font-bold block">Tampilkan Pop-up Modal?</span>
                  <span className="text-[11px] text-gray-400">Jika ON, modal & badge H-? akan muncul di website</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C44341]"></div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#C44341] hover:bg-[#A93434] disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg hover:shadow-[#C44341]/50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isLoading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Publikasikan Jadwal"}
              </button>
            </form>
          </div>

          {/* Right Column: List of Schedules */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-black uppercase text-white" style={{ fontFamily: "var(--font-display)" }}>
                📋 Daftar Jadwal Gowes ({schedules.length})
              </h2>
              <button
                onClick={fetchSchedules}
                disabled={isLoading}
                className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white cursor-pointer"
              >
                🔄 Refresh Data
              </button>
            </div>

            {isLoading && schedules.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-mono text-xs bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                Memuat data jadwal...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-10 bg-black/70 backdrop-blur-xl rounded-3xl border border-white/15 text-center space-y-3">
                <div className="text-3xl">🚴‍♂️</div>
                <p className="text-base text-gray-200 font-bold">Belum ada jadwal yang ditambahkan</p>
                <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">
                  Saat ini website tidak menampilkan pop-up apa pun. Silakan tambahkan jadwal baru melalui form di samping agar pop-up reminder mulai muncul.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((item) => {
                  const countdown = calculateDaysRemaining(item.date);
                  const fullDate = formatIndonesianFullDate(item.date);

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${item.isActive
                        ? "bg-black/75 border-[#C44341]/60 shadow-xl"
                        : "bg-black/45 border-white/10 opacity-60"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white ${countdown.badgeColor}`}>
                              {countdown.label}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${item.isActive ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300" : "bg-gray-800 text-gray-400"}`}>
                              {item.isActive ? "● POPUP AKTIF (TAMPIL)" : "○ NONAKTIF (SEMBUNYI)"}
                            </span>
                          </div>

                          <h3 className="text-lg font-black uppercase text-white leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                            {item.title}
                          </h3>

                          <div className="text-xs text-gray-300 font-mono space-y-1 pt-1">
                            <p>📅 {fullDate} • {item.time}</p>
                            <p>📍 {item.meetingPoint} ({item.distance})</p>
                            {item.notes && <p className="text-gray-400 italic">💡 {item.notes}</p>}
                          </div>
                        </div>

                        {/* Quick Toggle & Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-center pt-2 sm:pt-0">
                          {/* Toggle Button */}
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Nyalakan / Matikan Pop-up Modal di Website"
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${item.isActive
                              ? "bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30"
                              : "bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10"
                              }`}
                          >
                            {item.isActive ? "Matikan Pop-up" : "Aktifkan Pop-up"}
                          </button>

                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-mono border border-blue-500/30 cursor-pointer"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-mono border border-red-500/30 cursor-pointer"
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
      </div>
    </main>
  );
}
