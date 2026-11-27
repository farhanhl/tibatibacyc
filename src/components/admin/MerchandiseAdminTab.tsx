"use client";

import React, { useState, useEffect } from "react";
import { MerchandiseOrder, MerchandiseSize } from "@/types/merchandise";
import {
  updateMerchandiseOrderStatus,
  updateMerchandiseOrder,
  deleteMerchandiseOrder,
} from "@/lib/merchandiseService";

interface MerchandiseAdminTabProps {
  orders: MerchandiseOrder[];
  onRefresh: () => Promise<void> | void;
}

const AVAILABLE_SIZES: MerchandiseSize[] = [
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
];

export default function MerchandiseAdminTab({
  orders,
  onRefresh,
}: MerchandiseAdminTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "completed" | "cancelled"
  >("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<MerchandiseOrder | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<{
    nama: string;
    whatsapp: string;
    statusPelajar: "bukan_pelajar" | "pelajar";
    ukuran: MerchandiseSize;
    qty: number;
    hargaSatuan: number;
    totalHarga: number;
    sudahBayar: number;
    status: MerchandiseOrder["status"];
    catatan: string;
  }>({
    nama: "",
    whatsapp: "",
    statusPelajar: "bukan_pelajar",
    ukuran: "L",
    qty: 1,
    hargaSatuan: 190000,
    totalHarga: 190000,
    sudahBayar: 0,
    status: "pending",
    catatan: "",
  });

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingOrder && !isSavingEdit) {
        setEditingOrder(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingOrder, isSavingEdit]);

  // Perhitungan Statistik
  const totalOrders = orders.length;
  const totalPcs = orders.reduce((sum, o) => sum + (o.qty || 1), 0);
  const totalNominal = orders.reduce((sum, o) => sum + (o.totalHarga || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.sudahBayar || 0), 0);

  const totalConfirmed = orders
    .filter((o) => o.status === "confirmed" || o.status === "completed")
    .reduce((sum, o) => sum + (o.qty || 1), 0);
  const totalPending = orders
    .filter((o) => o.status === "pending")
    .reduce((sum, o) => sum + (o.qty || 1), 0);

  // Breakdown Ukuran
  const sizeBreakdown: Record<string, number> = {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    "2XL": 0,
    "3XL": 0,
    "4XL": 0,
    "5XL": 0,
  };
  orders.forEach((o) => {
    const sz = o.ukuran === "XXL" ? "2XL" : o.ukuran;
    if (sizeBreakdown[sz] !== undefined) {
      sizeBreakdown[sz] += o.qty || 1;
    } else {
      sizeBreakdown[sz] = o.qty || 1;
    }
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "-";
    }
  };

  // Filter Data
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.whatsapp.includes(searchQuery) ||
      (o.id && o.id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (
    orderId: string,
    newStatus: MerchandiseOrder["status"]
  ) => {
    setUpdatingId(orderId);
    try {
      await updateMerchandiseOrderStatus(orderId, newStatus);
      await onRefresh();
      setNotification({
        type: "success",
        text: `Status pesanan berhasil diperbarui menjadi "${newStatus}".`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status pesanan.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (order: MerchandiseOrder) => {
    if (
      !confirm(
        `Apakah yakin ingin menghapus pesanan atas nama "${order.nama}"? Tindakan ini tidak bisa dibatalkan.`
      )
    ) {
      return;
    }

    if (!order.id) return;
    setUpdatingId(order.id);
    try {
      await deleteMerchandiseOrder(order.id);
      await onRefresh();
      setNotification({
        type: "success",
        text: `Pesanan atas nama "${order.nama}" berhasil dihapus.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus pesanan.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenEdit = (order: MerchandiseOrder) => {
    setEditingOrder(order);
    const safeSize = (order.ukuran === "XXL" ? "2XL" : order.ukuran) || "L";
    const qty = order.qty || 1;
    const hargaSatuan = order.hargaSatuan || 190000;
    const totalHarga = order.totalHarga || qty * hargaSatuan;
    const statusPelajar: "bukan_pelajar" | "pelajar" =
      order.statusPelajar === "pelajar" || order.isPelajar === true
        ? "pelajar"
        : "bukan_pelajar";

    setEditForm({
      nama: order.nama || "",
      whatsapp: order.whatsapp || "",
      statusPelajar,
      ukuran: safeSize as MerchandiseSize,
      qty,
      hargaSatuan,
      totalHarga,
      sudahBayar: order.sudahBayar ?? 0,
      status: order.status || "pending",
      catatan: order.catatan || "",
    });
    setEditError(null);
  };

  const handleCloseEdit = () => {
    if (isSavingEdit) return;
    setEditingOrder(null);
    setEditError(null);
  };

  const handleQtyChange = (val: number) => {
    const qty = Math.max(1, Math.floor(val) || 1);
    setEditForm((prev) => ({
      ...prev,
      qty,
      totalHarga: qty * prev.hargaSatuan,
    }));
  };

  const handleHargaSatuanChange = (val: number) => {
    const hargaSatuan = Math.max(0, Math.floor(val) || 0);
    setEditForm((prev) => ({
      ...prev,
      hargaSatuan,
      totalHarga: prev.qty * hargaSatuan,
    }));
  };

  const handleRecalculateTotal = () => {
    setEditForm((prev) => ({
      ...prev,
      totalHarga: prev.qty * prev.hargaSatuan,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder || !editingOrder.id) return;

    if (!editForm.nama.trim()) {
      setEditError("Nama pemesan wajib diisi.");
      return;
    }

    if (!editForm.whatsapp.trim()) {
      setEditError("Nomor WhatsApp pemesan wajib diisi.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      await updateMerchandiseOrder(editingOrder.id, {
        nama: editForm.nama.trim(),
        whatsapp: editForm.whatsapp.trim(),
        statusPelajar: editForm.statusPelajar,
        isPelajar: editForm.statusPelajar === "pelajar",
        pelajar: editForm.statusPelajar === "pelajar" ? "pelajar" : "bukan pelajar",
        ukuran: editForm.ukuran,
        qty: Number(editForm.qty),
        hargaSatuan: Number(editForm.hargaSatuan),
        totalHarga: Number(editForm.totalHarga),
        sudahBayar: Math.max(0, Number(editForm.sudahBayar) || 0),
        status: editForm.status,
        catatan: editForm.catatan.trim() || "",
      });

      setNotification({
        type: "success",
        text: `Pesanan atas nama "${editForm.nama.trim()}" berhasil diperbarui!`,
      });
      setTimeout(() => setNotification(null), 4000);

      setEditingOrder(null);
      await onRefresh();
    } catch (err: unknown) {
      console.error("Gagal mengupdate pesanan:", err);
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan pesanan.";
      setEditError(message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getCleanPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    }
    return clean;
  };

  const handleCopyVendorSummary = () => {
    const totalPelajar = orders.filter((o) => o.statusPelajar === "pelajar" || o.isPelajar === true).length;
    const totalBukanPelajar = orders.length - totalPelajar;

    let text = `REKAP PRODUKSI ROMPI TIBA-TIBA CYCLING\n`;
    text += `Spesifikasi: Bahan Ripstop • Pakai Furing • Bordir Belakang • Sablon DTF Depan (Harga Fix: Rp 190.000)\n`;
    text += `Total Pesanan: ${totalOrders} Orang (${totalPcs} Pcs)\n`;
    text += `Kategori: ${totalPelajar} Pelajar • ${totalBukanPelajar} Bukan Pelajar (Umum)\n`;
    text += `Estimasi Total: ${formatCurrency(totalNominal)}\n\n`;
    text += `BREAKDOWN UKURAN:\n`;
    Object.entries(sizeBreakdown).forEach(([sz, count]) => {
      text += `- Size ${sz}: ${count} pcs\n`;
    });
    text += `\nDAFTAR PEMESAN:\n`;
    orders.forEach((o, i) => {
      const kat = o.statusPelajar === "pelajar" || o.isPelajar === true ? "Pelajar" : "Bukan Pelajar";
      text += `${i + 1}. ${o.nama} [${kat}] (${o.whatsapp}) - Size ${o.ukuran} x${o.qty}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Notification Toast/Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between border transition-all ${
            notification.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-red-500/15 border-red-500/40 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === "success" ? "✅" : "⚠️"}</span>
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pemesan */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>TOTAL PEMESAN</span>
            <span className="text-base">👤</span>
          </div>
          <div
            className="text-3xl font-black text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {totalOrders} <span className="text-xs font-normal text-gray-400">Orang</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Total pemesan yang telah mengisi form
          </p>
        </div>

        {/* Card 2: Total Pcs Rompi */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>JUMLAH PRODUKSI</span>
            <span className="text-base">🦺</span>
          </div>
          <div
            className="text-3xl font-black text-[#C44341]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {totalPcs} <span className="text-xs font-normal text-gray-400">Pcs</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Total rompi yang akan diproduksi
          </p>
        </div>

        {/* Card 3: Status Terkonfirmasi */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>STATUS PESANAN</span>
            <span className="text-base">✅</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono pt-1">
            {totalConfirmed} <span className="text-xs text-gray-300 font-normal">Pcs Terkonfirmasi</span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono">
            {totalPending} pcs masih pending
          </p>
        </div>

        {/* Card 4: Total Estimasi Nilai */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>ESTIMASI OMSET</span>
            <span className="text-base">💰</span>
          </div>
          <div
            className="text-2xl sm:text-3xl font-black text-emerald-400"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatCurrency(totalNominal)}
          </div>
          <p className="text-[11px] text-gray-400 font-mono">
            Masuk: <span className="text-emerald-400 font-bold">{formatCurrency(totalPaid)}</span> • Sisa: {formatCurrency(Math.max(0, totalNominal - totalPaid))}
          </p>
        </div>
      </div>

      {/* Breakdown Ukuran Rompi */}
      <div className="p-5 rounded-2xl bg-black/55 border border-white/15 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono text-gray-400 uppercase font-bold">
            Breakdown Ukuran Rompi (Pcs):
          </span>
          <button
            type="button"
            onClick={handleCopyVendorSummary}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#C44341] text-white text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋</span>
            <span>{copiedSummary ? "Tersalin ke Clipboard!" : "Salin Rekap untuk Vendor"}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Object.entries(sizeBreakdown).map(([sz, count]) => (
            <div
              key={sz}
              className="p-3 rounded-xl bg-black/40 border border-white/10 text-center"
            >
              <span className="text-xs font-mono text-gray-400 block">Size {sz}</span>
              <span
                className="text-xl font-black text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {count} <span className="text-xs font-normal text-gray-400">pcs</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pemesan, no WhatsApp, atau ID..."
            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs font-mono placeholder:text-gray-500 outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "Semua" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Terkonfirmasi" },
              { id: "completed", label: "Selesai" },
              { id: "cancelled", label: "Batal" },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? "bg-[#C44341] text-white font-bold"
                  : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-black uppercase text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Daftar Pesanan Pre-Order ({filteredOrders.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400">
            Realtime Firestore Sync
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-mono text-xs">
            Tidak ada pesanan yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black/80 text-gray-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-4">Nama & WhatsApp</th>
                  <th className="py-3 px-3 text-center">Pelajar / Bukan</th>
                  <th className="py-3 px-3 text-center">Ukuran</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-4">Total Biaya</th>
                  <th className="py-3 px-4">Sudah Bayar</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {filteredOrders.map((ord, idx) => {
                  const phoneClean = getCleanPhone(ord.whatsapp);
                  const waChatUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(
                    `Halo ${ord.nama}! Kami dari Admin Tiba-Tiba Cycling terkait pemesanan Tactical Riding Vest kamu (#${
                      ord.id || ""
                    }) dengan total ${formatCurrency(ord.totalHarga)}.`
                  )}`;

                  return (
                    <tr
                      key={ord.id || idx}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-gray-500 font-bold">
                        {idx + 1}
                      </td>

                      {/* Nama & WhatsApp */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">
                          {ord.nama}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-0.5">
                          <span>📱 {ord.whatsapp}</span>
                          <a
                            href={waChatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#C44341] hover:underline font-bold"
                            title="Chat Pemesan via WhatsApp"
                          >
                            [Chat WA]
                          </a>
                        </div>
                        {ord.catatan && (
                          <div className="text-[10px] text-amber-300/80 pt-1 italic">
                            💬 &quot;{ord.catatan}&quot;
                          </div>
                        )}
                      </td>

                      {/* Pelajar / Bukan */}
                      <td className="py-3 px-3 text-center">
                        {ord.statusPelajar === "pelajar" || ord.isPelajar === true ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300 whitespace-nowrap">
                            🎒 Pelajar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 border border-white/15 text-gray-400 text-[10px] whitespace-nowrap">
                            Bukan Pelajar
                          </span>
                        )}
                      </td>

                      {/* Ukuran */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold">
                          {ord.ukuran}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-3 text-center font-bold text-white">
                        {ord.qty} pcs
                      </td>

                      {/* Total Biaya */}
                      <td className="py-3 px-4 font-bold text-[#C44341]">
                        {formatCurrency(ord.totalHarga)}
                      </td>

                      {/* Sudah Bayar */}
                      <td className="py-3 px-4">
                        {(() => {
                          const paid = ord.sudahBayar ?? 0;
                          const remaining = Math.max(0, (ord.totalHarga || 0) - paid);
                          const isPaidOff = paid >= (ord.totalHarga || 0) && (ord.totalHarga || 0) > 0;
                          return (
                            <div className="space-y-0.5">
                              <span
                                className={`font-bold block ${
                                  isPaidOff
                                    ? "text-emerald-400"
                                    : paid > 0
                                    ? "text-amber-300"
                                    : "text-gray-400"
                                }`}
                              >
                                {formatCurrency(paid)}
                              </span>
                              <span className="text-[10px] block text-gray-400">
                                {isPaidOff
                                  ? "✓ Lunas"
                                  : `Sisa ${formatCurrency(remaining)}`}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3 text-gray-400 text-[11px]">
                        {formatDate(ord.createdAt)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3 text-center">
                        <select
                          disabled={updatingId === ord.id}
                          value={ord.status}
                          onChange={(e) =>
                            ord.id &&
                            handleStatusChange(
                              ord.id,
                              e.target.value as MerchandiseOrder["status"]
                            )
                          }
                          className="bg-black/80 border border-white/20 text-[11px] rounded-lg px-2 py-1 text-white outline-none cursor-pointer focus:border-[#C44341]"
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="confirmed">✅ Terkonfirmasi</option>
                          <option value="completed">🎉 Selesai</option>
                          <option value="cancelled">❌ Batal</option>
                        </select>
                      </td>

                      {/* Aksi: Edit & Hapus */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ord)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1 font-bold border border-amber-500/30"
                            title="Edit Data Pesanan"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === ord.id}
                            onClick={() => handleDelete(ord)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-white transition-colors cursor-pointer text-xs border border-red-500/20"
                            title="Hapus Pesanan"
                          >
                            🗑️
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

      {/* Edit Order Modal */}
      {editingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseEdit}
        >
          <div
            className="relative w-full max-w-xl bg-[#0c0d0e] border border-white/20 rounded-2xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Red Gradient Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E03A3E] via-[#C44341] to-[#8E1B1D]" />

            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <h3
                    className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Edit Data Pesanan
                  </h3>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-mono text-gray-400">
                    ID Pesanan:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs font-bold">
                    #{editingOrder.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSavingEdit}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4 font-mono">
              {/* Error Alert */}
              {editError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 1: Nama Pemesan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">
                    Nama Pemesan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nama}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, nama: e.target.value }))
                    }
                    placeholder="Nama Lengkap..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none transition-colors"
                  />
                </div>

                {/* Field 2: No. WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">
                    Nomor WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.whatsapp}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none transition-colors"
                  />
                </div>

                {/* Field 3: Status Pelajar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">
                    Kategori (Pelajar / Bukan) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editForm.statusPelajar}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        statusPelajar: e.target.value as "bukan_pelajar" | "pelajar",
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none cursor-pointer transition-colors"
                  >
                    <option value="bukan_pelajar">Bukan Pelajar / Umum</option>
                    <option value="pelajar">🎒 Pelajar / Mahasiswa</option>
                  </select>
                </div>

                {/* Field 4: Ukuran Rompi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">
                    Ukuran Rompi (Size) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editForm.ukuran}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        ukuran: e.target.value as MerchandiseSize,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none cursor-pointer transition-colors"
                  >
                    {AVAILABLE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        Size {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 4: Jumlah (Qty) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">
                    Jumlah (Pcs) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(editForm.qty - 1)}
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={editForm.qty}
                      onChange={(e) => handleQtyChange(Number(e.target.value))}
                      className="w-full px-3 py-2 text-center rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs font-bold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(editForm.qty + 1)}
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Field 5: Harga Satuan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 block">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editForm.hargaSatuan}
                    onChange={(e) =>
                      handleHargaSatuanChange(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none transition-colors"
                  />
                  <span className="text-[10px] text-gray-400 block">
                    {formatCurrency(editForm.hargaSatuan)} / pcs
                  </span>
                </div>

                {/* Field 6: Total Biaya */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 block">
                      Total Biaya (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={handleRecalculateTotal}
                      className="text-[10px] text-[#C44341] hover:underline cursor-pointer"
                      title="Hitung ulang otomatis: Qty x Harga Satuan"
                    >
                      Hitung Ulang
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editForm.totalHarga}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        totalHarga: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-[#C44341]/40 focus:border-[#C44341] text-emerald-400 font-bold text-xs outline-none transition-colors"
                  />
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    {formatCurrency(editForm.totalHarga)}
                  </span>
                </div>

                {/* Field 7: Sudah Bayar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 block">
                      Sudah Bayar (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          sudahBayar: prev.totalHarga,
                        }))
                      }
                      className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                      title="Isi otomatis sesuai Total Biaya (Lunas)"
                    >
                      Set Lunas
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editForm.sudahBayar}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        sudahBayar: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-emerald-500/30 focus:border-emerald-400 text-white font-bold text-xs outline-none transition-colors"
                  />
                  <span className="text-[10px] text-gray-400 block">
                    {formatCurrency(editForm.sudahBayar)}
                    {editForm.totalHarga > 0 && (
                      <>
                        {" "}
                        •{" "}
                        {editForm.sudahBayar >= editForm.totalHarga ? (
                          <span className="text-emerald-400 font-bold">Lunas</span>
                        ) : (
                          <span className="text-amber-300">
                            Kurang {formatCurrency(editForm.totalHarga - editForm.sudahBayar)}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>

                {/* Field 8: Status Pesanan */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300 block">
                    Status Pemesanan <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value as MerchandiseOrder["status"],
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none cursor-pointer transition-colors"
                  >
                    <option value="pending">⏳ Pending (Menunggu Verifikasi Pembayaran)</option>
                    <option value="confirmed">✅ Terkonfirmasi (Lunas / Masuk Produksi)</option>
                    <option value="completed">🎉 Selesai (Barang Telah Diserahkan / Terkirim)</option>
                    <option value="cancelled">❌ Batal (Pesanan Dibatalkan)</option>
                  </select>
                </div>

                {/* Field 8: Catatan Tambahan */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-300 block">
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.catatan}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        catatan: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Titip di sekretariat gowes, lunas transfer BCA, dll..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#C44341] text-white text-xs outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#C44341] hover:bg-[#A93434] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-[#C44341]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingEdit ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
