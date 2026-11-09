"use client";

import React, { useState, useEffect } from "react";
import { AdminPinRecord, AdminTabId, ADMIN_MODULES } from "@/types/admin";

/**
 * Fetch wrapper dengan batasan waktu timeout (default 10 detik)
 * agar UI tidak pernah stuck loading jika koneksi internet terputus atau lambat.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Koneksi timeout. Server atau database membutuhkan waktu terlalu lama untuk merespons.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default function PinsAdminTab() {
  const [pins, setPins] = useState<AdminPinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    label: string;
    pin: string;
    allowedTabs: AdminTabId[];
    isActive: boolean;
  }>({
    label: "",
    pin: "",
    allowedTabs: ["events", "media"],
    isActive: true,
  });

  // State visibility PIN di tabel (id PIN yang sedang di-reveal)
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  const fetchPins = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithTimeout("/api/admin/pins", {}, 10000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      setPins(data.pins || []);
    } catch (err: any) {
      console.error("Gagal memuat master PIN:", err);
      setMessage({ type: "error", text: "Gagal memuat master PIN: " + (err.message || "Gangguan koneksi.") });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingId(null);
    setFormData({
      label: "",
      pin: "",
      allowedTabs: ["events", "media"],
      isActive: true,
    });
    setIsFormOpen(true);
    setMessage(null);
  };

  const handleOpenEditForm = (item: AdminPinRecord) => {
    setEditingId(item.id);
    setFormData({
      label: item.label,
      pin: item.pin,
      allowedTabs: item.allowedTabs,
      isActive: item.isActive,
    });
    setIsFormOpen(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleTabPermission = (tabId: AdminTabId) => {
    setFormData((prev) => {
      const exists = prev.allowedTabs.includes(tabId);
      if (exists) {
        return {
          ...prev,
          allowedTabs: prev.allowedTabs.filter((id) => id !== tabId),
        };
      } else {
        return {
          ...prev,
          allowedTabs: [...prev.allowedTabs, tabId],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.pin.trim()) {
      setMessage({ type: "error", text: "Nama / Label dan PIN wajib diisi." });
      return;
    }
    if (formData.pin.trim().length < 4) {
      setMessage({ type: "error", text: "PIN minimal harus terdiri dari 4 digit/karakter." });
      return;
    }
    if (formData.allowedTabs.length === 0) {
      setMessage({ type: "error", text: "Pilih minimal 1 modul fitur yang boleh diakses." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const isEditing = Boolean(editingId);
      const url = "/api/admin/pins";
      const method = isEditing ? "PUT" : "POST";
      const payload = isEditing ? { id: editingId, ...formData } : formData;

      const res = await fetchWithTimeout(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        12000
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan PIN.");
      }

      setMessage({ type: "success", text: `✅ ${data.message || "PIN berhasil disimpan!"}` });
      setIsFormOpen(false);
      setEditingId(null);
      await fetchPins();
    } catch (err: any) {
      console.error("Gagal simpan PIN:", err);
      setMessage({ type: "error", text: err.message || "Gagal menyimpan data PIN." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePin = async (id: string, label: string) => {
    if (!confirm(`Hapus akses PIN untuk "${label}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithTimeout(
        `/api/admin/pins?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
        10000
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus PIN.");
      }
      setMessage({ type: "success", text: "🗑️ PIN berhasil dihapus." });
      await fetchPins();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menghapus PIN." });
      setIsLoading(false);
    }
  };

  const togglePinVisibility = (id: string) => {
    setRevealedPins((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔐</span>
            <h2
              className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Master Data Akses &amp; PIN Admin
            </h2>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1 max-w-2xl">
            Tentukan modul apa saja yang boleh dikelola oleh masing-masing PIN. Setiap PIN bertindak sebagai level akses khusus untuk pengurus/divisi Anda.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-xs font-mono font-bold text-white uppercase tracking-wider transition-all shadow-md hover:shadow-[#C44341]/40 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>➕</span>
            <span>Buat PIN Baru</span>
          </button>
        )}
      </div>

      {/* Super Admin Notice Card */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start gap-3">
        <span className="text-lg shrink-0">👑</span>
        <div>
          <strong className="block font-bold text-amber-300">
            Peran Super Admin (Master Key)
          </strong>
          <span>
            Master PIN Anda yang dikonfigurasi di Environment Variable (<code>ADMIN_PIN</code>) selalu memiliki akses 100% penuh ke seluruh fitur dan menu kelola PIN ini. PIN kustom di bawah dibuat untuk anggota pengurus atau divisi tertentu agar aksesnya terbatasi secara aman.
          </span>
        </div>
      </div>

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

      {/* Form Tambah / Edit PIN */}
      {isFormOpen && (
        <div className="bg-black/65 backdrop-blur-md border border-[#C44341]/60 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3
                className="text-lg font-black uppercase text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {editingId ? "✏️ Edit Level Akses & PIN" : "➕ Buat PIN & Hak Akses Baru"}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Pilih modul apa saja yang dapat dibuka saat PIN ini digunakan untuk login.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer font-mono"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama / Label Petugas */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">
                  NAMA PETUGAS / DIVISI *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Contoh: Admin Tim Dokumentasi / Admin Merchandise"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
                />
              </div>

              {/* Nilai PIN */}
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">
                  PIN RAHASIA (MINIMAL 4 KARAKTER) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="Contoh: 889922 atau doku2026"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341] tracking-wider font-bold"
                />
              </div>
            </div>

            {/* Pemilihan Modul Fitur (Interactive Checkbox Cards) */}
            <div className="space-y-2">
              <label className="block text-gray-300 font-bold">
                PILIH MODUL FITUR YANG DIIZINKAN *
              </label>
              <p className="text-[11px] text-gray-400">
                Centang modul yang dapat diakses oleh admin yang menggunakan PIN ini:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {ADMIN_MODULES.map((mod) => {
                  const isChecked = formData.allowedTabs.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleTabPermission(mod.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isChecked
                          ? "bg-[#C44341]/15 border-[#C44341] text-white shadow-md shadow-[#C44341]/10"
                          : "bg-black/40 border-white/10 text-gray-400 hover:border-white/25 hover:bg-black/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="mt-0.5 accent-[#C44341] w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                          <span>{mod.icon}</span>
                          <span className="truncate">{mod.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toggle Status Aktif / Nonaktif */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Status Akses PIN</span>
                <span className="text-[11px] text-gray-400">
                  {formData.isActive
                    ? "PIN ini sedang AKTIF dan dapat digunakan untuk login."
                    : "PIN dinonaktifkan sementara (tidak bisa login)."}
                </span>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#C44341] hover:bg-[#A93434] disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-xs shadow-lg hover:shadow-[#C44341]/50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan PIN" : "Buat & Aktifkan PIN"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer text-xs"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel / Daftar PIN Terdaftar */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3
              className="text-lg font-black uppercase text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              📋 Daftar PIN Admin Kustom ({pins.length})
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Semua PIN di bawah tersimpan aman di database Firestore (<code>admin_pins</code>).
            </p>
          </div>
          <button
            onClick={fetchPins}
            disabled={isLoading}
            className="text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400 font-mono text-xs animate-pulse">
            Memuat daftar master PIN admin...
          </div>
        ) : pins.length === 0 ? (
          <div className="py-12 text-center space-y-3 font-mono">
            <span className="text-3xl block">🔑</span>
            <p className="text-sm font-bold text-gray-300">Belum ada PIN admin kustom.</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Saat ini seluruh akses menggunakan Master PIN Super Admin. Klik tombol &quot;Buat PIN Baru&quot; di atas untuk membuat PIN bagi divisi/pengurus lain.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/15 text-gray-400 uppercase">
                  <th className="py-3 px-4 font-bold">Nama / Divisi</th>
                  <th className="py-3 px-4 font-bold">PIN Rahasia</th>
                  <th className="py-3 px-4 font-bold">Modul yang Diizinkan</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-gray-200">
                {pins.map((item) => {
                  const isRevealed = revealedPins[item.id] || false;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      {/* Nama / Label */}
                      <td className="py-4 px-4 text-white font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C44341]"></span>
                          <span>{item.label}</span>
                        </div>
                      </td>

                      {/* PIN Rahasia dengan toggle reveal */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 bg-black/60 px-3 py-1 rounded-lg border border-white/10 font-bold">
                          <span>{isRevealed ? item.pin : "••••••"}</span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(item.id)}
                            className="text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                            title={isRevealed ? "Sembunyikan PIN" : "Lihat PIN"}
                          >
                            {isRevealed ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </td>

                      {/* Modul Akses */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {item.allowedTabs.map((tabId) => {
                            const mod = ADMIN_MODULES.find((m) => m.id === tabId);
                            return (
                              <span
                                key={tabId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white/10 border border-white/15 text-gray-300"
                              >
                                <span>{mod?.icon || "⚙️"}</span>
                                <span>{mod?.tag || tabId}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.isActive
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                              : "bg-gray-800 text-gray-400 border border-gray-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                            }`}
                          />
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer text-[11px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePin(item.id, item.label)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 transition-colors cursor-pointer text-[11px]"
                          >
                            Hapus
                          </button>
                        </div>
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
  );
}

