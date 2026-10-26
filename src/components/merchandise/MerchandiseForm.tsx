"use client";

import React, { useState } from "react";
import { saveMerchandiseOrder } from "@/lib/merchandiseService";
import { MerchandiseSize } from "@/types/merchandise";
import SizeChartModal from "@/components/merchandise/SizeChartModal";

const SIZES: MerchandiseSize[] = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

export default function MerchandiseForm() {
  const [nama, setNama] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [furing, setFuring] = useState<"pakai" | "tanpa">("pakai");
  const [desainBelakang, setDesainBelakang] = useState<"sablon" | "bordir">("sablon");
  const [ukuran, setUkuran] = useState<MerchandiseSize>("L");
  const [qty, setQty] = useState(1);
  const [catatan, setCatatan] = useState("");
  const [showSizeModal, setShowSizeModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>("");

  // Perhitungan Harga
  const basePrice = 185000;
  const bordirAddition = desainBelakang === "bordir" ? 20000 : 0;
  const hargaSatuan = basePrice + bordirAddition;
  const totalHarga = hargaSatuan * qty;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      alert("Mohon masukkan nama lengkap pemesan.");
      return;
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 8) {
      alert("Mohon masukkan nomor WhatsApp yang valid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = await saveMerchandiseOrder({
        nama: nama.trim(),
        whatsapp: whatsapp.trim(),
        furing,
        desainBelakang,
        ukuran,
        qty,
        hargaSatuan,
        totalHarga,
        catatan: catatan.trim(),
      });

      setCreatedOrderId(orderId);
      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat menyimpan data pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setNama("");
    setWhatsapp("");
    setCatatan("");
    setQty(1);
    setSubmitSuccess(false);
  };

  return (
    <div id="order-form" className="relative p-6 sm:p-8 rounded-2xl bg-[#12141A] border border-white/20 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="space-y-1 border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-[#C44341]/20 border border-[#C44341]/50 text-[#C44341] text-[11px] font-mono font-bold uppercase tracking-wider">
            Pre-Order Form
          </span>
          <span className="text-xs font-mono text-gray-400">Tahap 1</span>
        </div>
        <h3
          className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Form Pemesanan Rompi
        </h3>
        <p className="text-xs text-gray-400">
          Silakan lengkapi data pemesanan di bawah. Data kamu akan dicatat dalam list produksi rompi Tiba-Tiba Cycling.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama Pemesan */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
            <span>Nama Lengkap / Panggilan Gowes *</span>
          </label>
          <input
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Farhan / Om Ryan"
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] text-white text-sm placeholder:text-gray-600 outline-none transition-all"
          />
        </div>

        {/* Nomor WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
            <span>Nomor WhatsApp / HP Aktif *</span>
          </label>
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] text-white text-sm placeholder:text-gray-600 outline-none transition-all"
          />
        </div>

        {/* Pilihan Furing (Wajib / Opsi) */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 block">
            Lapisan Furing Dalam (Furring) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFuring("pakai")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${furing === "pakai"
                ? "bg-[#C44341]/15 border-[#C44341] text-white ring-1 ring-[#C44341]"
                : "bg-black/50 border-white/10 text-gray-400 hover:border-white/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono">Pakai Furing</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${furing === "pakai" ? "border-[#C44341] bg-[#C44341] text-white" : "border-white/30"
                  }`}>
                  {furing === "pakai" ? "✓" : ""}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1">
                ⭐ Direkomendasikan. Nyaman di kulit, lebih rapi & kokoh.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFuring("tanpa")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${furing === "tanpa"
                ? "bg-[#C44341]/15 border-[#C44341] text-white ring-1 ring-[#C44341]"
                : "bg-black/50 border-white/10 text-gray-400 hover:border-white/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono">Tanpa Furing</span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${furing === "tanpa" ? "border-[#C44341] bg-[#C44341] text-white" : "border-white/30"
                  }`}>
                  {furing === "tanpa" ? "✓" : ""}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1">
                Versi 1 lapis American Drill murni tanpa pelapis dalam.
              </span>
            </button>
          </div>
        </div>

        {/* Pilihan Desain Belakang: Sablon vs Bordir (+20k) */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 block">
            Desain Tulisan Belakang (Punggung) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDesainBelakang("sablon")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${desainBelakang === "sablon"
                ? "bg-[#C44341]/15 border-[#C44341] text-white ring-1 ring-[#C44341]"
                : "bg-black/50 border-white/10 text-gray-400 hover:border-white/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold font-mono block">Sablon Grafis</span>
                  <span className="text-xs font-black text-[#C44341]">Rp 185.000</span>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${desainBelakang === "sablon" ? "border-[#C44341] bg-[#C44341] text-white" : "border-white/30"
                  }`}>
                  {desainBelakang === "sablon" ? "✓" : ""}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1">
                Sablon karet premium awet & lentur. Harga standar.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDesainBelakang("bordir")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${desainBelakang === "bordir"
                ? "bg-[#C44341]/15 border-[#C44341] text-white ring-1 ring-[#C44341]"
                : "bg-black/50 border-white/10 text-gray-400 hover:border-white/30"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold font-mono block">Bordir Komputer</span>
                  <span className="text-xs font-black text-amber-400">Rp 205.000 (+20k)</span>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${desainBelakang === "bordir" ? "border-[#C44341] bg-[#C44341] text-white" : "border-white/30"
                  }`}>
                  {desainBelakang === "bordir" ? "✓" : ""}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-1">
                Bordir benang timbul bertekstur mewah & tahan lama.
              </span>
            </button>
          </div>
        </div>

        {/* Pilihan Ukuran (Size) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 block">
              Pilih Ukuran (Size) *
            </label>
            <button
              type="button"
              onClick={() => setShowSizeModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#C44341] hover:text-white transition-colors"
            >
              <span>📏 Panduan Ukuran</span>
              <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setUkuran(sz)}
                className={`py-2.5 rounded-xl border font-mono font-bold text-xs transition-all cursor-pointer ${ukuran === sz
                  ? "bg-[#C44341] border-[#C44341] text-white shadow-md shadow-[#C44341]/30"
                  : "bg-black/50 border-white/10 text-gray-300 hover:border-white/30"
                  }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Jumlah Pesanan (Qty Stepper) */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 block">
            Jumlah Pesanan (Qty)
          </label>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-white/20 bg-black/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center text-lg font-bold text-gray-300 hover:bg-white/10 transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center text-sm font-bold font-mono text-white">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 flex items-center justify-center text-lg font-bold text-gray-300 hover:bg-white/10 transition-colors"
              >
                +
              </button>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              = {qty} pcs Rompi
            </span>
          </div>
        </div>

        {/* Catatan Tambahan */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
            <span>Catatan Khusus (Opsional)</span>
            <span className="text-[10px] text-gray-500 font-normal">Misal: request ukuran khusus</span>
          </label>
          <textarea
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tulis catatan jika ada permintaan khusus..."
            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] focus:ring-1 focus:ring-[#C44341] text-white text-sm placeholder:text-gray-600 outline-none transition-all resize-none"
          />
        </div>

        {/* Summary Box */}
        <div className="p-4 rounded-xl bg-black/70 border border-white/10 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Harga Satuan ({desainBelakang === "bordir" ? "Versi Bordir" : "Versi Sablon"}):</span>
            <span className="font-bold text-white">{formatCurrency(hargaSatuan)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Lapisan Furing:</span>
            <span className="text-[#C44341] font-semibold">
              {furing === "pakai" ? "Sudah termasuk (Pakai Furing)" : "Tanpa Furing"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Ukuran & Jumlah:</span>
            <span>Size {ukuran} x {qty} pcs</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm sm:text-base font-bold text-white">
            <span>Total Estimasi:</span>
            <span className="text-xl sm:text-2xl text-[#C44341]" style={{ fontFamily: "var(--font-display)" }}>
              {formatCurrency(totalHarga)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-[#C44341] hover:bg-[#A93434] text-white font-black uppercase text-sm sm:text-base tracking-wider rounded-xl transition-all shadow-xl hover:shadow-[#C44341]/50 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memproses Pesanan...</span>
            </>
          ) : (
            <>
              <span>🚴 Konfirmasi & Kirim Pesanan</span>
              <span>→</span>
            </>
          )}
        </button>
      </form>

      {/* Success Modal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-md w-full bg-[#12141A] rounded-2xl border border-white/20 p-6 sm:p-8 space-y-5 text-white shadow-2xl">
            {/* Top Badge */}
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-3xl">
              ✅
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Pesanan Berhasil Disimpan!
              </span>
              <h4
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Terima Kasih, {nama}!
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed pt-1">
                Data pre-order rompi kamu telah berhasil tersimpan di sistem kami. Kamu bisa mengecek status pesanan pada tabel pemesan di bawah.
              </p>
            </div>

            {/* Order Card Recap */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-400 border-b border-white/10 pb-2">
                <span>No. Pesanan:</span>
                <span className="text-white font-bold">#{createdOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pilihan:</span>
                <span className="text-white">
                  Size {ukuran} • {furing === "pakai" ? "Pakai Furing" : "Tanpa Furing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Desain Belakang:</span>
                <span className="text-amber-400 font-bold uppercase">{desainBelakang}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Jumlah:</span>
                <span className="text-white font-bold">{qty} pcs</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
                <span>Total:</span>
                <span className="text-[#C44341]">{formatCurrency(totalHarga)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full py-3.5 px-4 bg-[#C44341] hover:bg-[#A93434] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✓ Selesai & Tutup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={showSizeModal}
        onClose={() => setShowSizeModal(false)}
        selectedSize={ukuran}
        onSelectSize={(sz) => setUkuran(sz as MerchandiseSize)}
      />
    </div>
  );
}
