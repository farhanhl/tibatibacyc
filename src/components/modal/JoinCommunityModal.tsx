"use client";

import React, { useState, useEffect } from "react";

interface JoinCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinUrl?: string;
}

export default function JoinCommunityModal({
  isOpen,
  onClose,
  joinUrl = "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z",
}: JoinCommunityModalProps) {
  const [nama, setNama] = useState("");
  const [domisili, setDomisili] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tangani event Escape dan lock scroll body saat modal aktif
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setError(null);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNama = nama.trim();
    const trimmedDomisili = domisili.trim();
    const trimmedPhone = phone.trim();

    // Validasi input
    if (!trimmedNama || trimmedNama.length < 2) {
      setError("Mohon masukkan nama lengkap atau panggilan Anda.");
      return;
    }

    if (!trimmedDomisili || trimmedDomisili.length < 2) {
      setError("Mohon isi kota / wilayah domisili Anda.");
      return;
    }

    const cleanPhone = trimmedPhone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 9 || !/^[0-9+]+$/.test(cleanPhone)) {
      setError("Mohon masukkan nomor WhatsApp yang valid (minimal 9 digit angka).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Kirim data ke API backend
      await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: trimmedNama,
          domisili: trimmedDomisili,
          phone: cleanPhone,
        }),
        keepalive: true,
      });
    } catch (err) {
      console.warn("[JoinModal] Gagal mengirim data ke API:", err);
      // Tetap lanjutkan membuka link agar user tidak terblokir
    } finally {
      setIsSubmitting(false);

      // Buka link WhatsApp grup
      const targetUrl = joinUrl || "https://chat.whatsapp.com/Iec3x7imtTKI9DMXaJzP9z";
      const opened = window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = targetUrl;
      }

      // Reset form dan tutup modal
      setNama("");
      setDomisili("");
      setPhone("");
      setError(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-[#12141A] border border-white/20 rounded-2xl shadow-2xl overflow-hidden text-white z-10 animate-in zoom-in-95 fade-in duration-300 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C44341] via-[#E15A58] to-black" />

        <div className="p-5 sm:p-7 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#C44341]/20 border border-[#C44341]/50 text-[#C44341] text-[11px] font-mono font-bold uppercase tracking-wider">
                <span>🚴 Form Pendaftaran Member</span>
              </div>
              <h3
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                GABUNG <span className="text-[#C44341]">TIBA-TIBA CYCLING</span>
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Lengkapi data diri kamu sebelum masuk ke grup WhatsApp resmi kami.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm shrink-0 disabled:opacity-50"
              aria-label="Tutup Formulir"
            >
              ✕
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 font-mono">
              <span className="text-base shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Nama */}
            <div className="space-y-1.5">
              <label
                htmlFor="join-nama"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300"
              >
                Nama Lengkap / Panggilan <span className="text-[#C44341]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  👤
                </span>
                <input
                  id="join-nama"
                  type="text"
                  required
                  autoFocus
                  placeholder="Contoh: Fai"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] transition-all text-sm font-sans disabled:opacity-50"
                />
              </div>
            </div>

            {/* Field: Domisili */}
            <div className="space-y-1.5">
              <label
                htmlFor="join-domisili"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300"
              >
                Domisili / Wilayah <span className="text-[#C44341]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  📍
                </span>
                <input
                  id="join-domisili"
                  type="text"
                  required
                  placeholder="Contoh: Bekasi Timur / Cikarang / Tambun"
                  value={domisili}
                  onChange={(e) => setDomisili(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] transition-all text-sm font-sans disabled:opacity-50"
                />
              </div>
            </div>

            {/* Field: Nomor Telepon / WhatsApp */}
            <div className="space-y-1.5">
              <label
                htmlFor="join-phone"
                className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300"
              >
                Nomor Telepon / WhatsApp <span className="text-[#C44341]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  📱
                </span>
                <input
                  id="join-phone"
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] transition-all text-sm font-sans disabled:opacity-50"
                />
              </div>
            </div>

            {/* Info Security Badge */}
            <p className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 pt-1">
              <span>🔒</span>
              <span>Data hanya digunakan untuk verifikasi anggota Tiba-Tiba Cycling.</span>
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-sm tracking-wider rounded-xl shadow-lg hover:shadow-[#C44341]/50 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>Masuk Grup WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
