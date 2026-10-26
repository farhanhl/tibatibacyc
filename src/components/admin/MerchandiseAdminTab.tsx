"use client";

import React, { useState } from "react";
import { MerchandiseOrder } from "@/types/merchandise";
import {
  updateMerchandiseOrderStatus,
  deleteMerchandiseOrder,
} from "@/lib/merchandiseService";

interface MerchandiseAdminTabProps {
  orders: MerchandiseOrder[];
  onRefresh: () => Promise<void> | void;
}

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

  // Perhitungan Statistik
  const totalOrders = orders.length;
  const totalPcs = orders.reduce((sum, o) => sum + (o.qty || 1), 0);
  const totalNominal = orders.reduce((sum, o) => sum + (o.totalHarga || 0), 0);

  const totalFuring = orders
    .filter((o) => o.furing === "pakai")
    .reduce((sum, o) => sum + (o.qty || 1), 0);
  const totalTanpaFuring = orders
    .filter((o) => o.furing === "tanpa")
    .reduce((sum, o) => sum + (o.qty || 1), 0);

  const totalBordir = orders
    .filter((o) => o.desainBelakang === "bordir")
    .reduce((sum, o) => sum + (o.qty || 1), 0);
  const totalSablon = orders
    .filter((o) => o.desainBelakang === "sablon")
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
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus pesanan.");
    } finally {
      setUpdatingId(null);
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
    let text = `REKAP PRODUKSI ROMPI TIBA-TIBA CYCLING\n`;
    text += `Total Pesanan: ${totalOrders} Orang (${totalPcs} Pcs)\n`;
    text += `Estimasi Total: ${formatCurrency(totalNominal)}\n\n`;
    text += `BREAKDOWN UKURAN:\n`;
    Object.entries(sizeBreakdown).forEach(([sz, count]) => {
      text += `- Size ${sz}: ${count} pcs\n`;
    });
    text += `\nBREAKDOWN SPESIFIKASI:\n`;
    text += `- Pakai Furing: ${totalFuring} pcs\n`;
    text += `- Tanpa Furing: ${totalTanpaFuring} pcs\n`;
    text += `- Bordir Belakang: ${totalBordir} pcs\n`;
    text += `- Sablon Belakang: ${totalSablon} pcs\n\n`;
    text += `DAFTAR PEMESAN:\n`;
    orders.forEach((o, i) => {
      text += `${i + 1}. ${o.nama} (${o.whatsapp}) - Size ${o.ukuran} x${o.qty} [${o.furing === "pakai" ? "Furing" : "No-Furing"}] [${o.desainBelakang}]\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
            <span>Furing: {totalFuring}</span>
            <span>•</span>
            <span>No-Furing: {totalTanpaFuring}</span>
          </div>
        </div>

        {/* Card 3: Desain Belakang */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>DESAIN BELAKANG</span>
            <span className="text-base">🪡</span>
          </div>
          <div className="text-xl font-black text-amber-400 font-mono pt-1">
            {totalBordir} <span className="text-xs text-gray-300 font-normal">Bordir</span> /{" "}
            {totalSablon} <span className="text-xs text-gray-300 font-normal">Sablon</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Selisih bordir komputer +Rp 20.000/pcs
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
          <p className="text-[11px] text-gray-400">
            Total akumulasi nilai pre-order
          </p>
        </div>
      </div>

      {/* Breakdown Ukuran Rompi */}
      <div className="p-5 rounded-2xl bg-black/55 border border-white/15 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-400 uppercase font-bold">
            Breakdown Ukuran Rompi (Pcs):
          </span>
          <button
            type="button"
            onClick={handleCopyVendorSummary}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#C44341] text-white text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
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
                  <th className="py-3 px-3 text-center">Ukuran</th>
                  <th className="py-3 px-3">Furing</th>
                  <th className="py-3 px-3">Desain</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-4">Total Biaya</th>
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
                            💬 "{ord.catatan}"
                          </div>
                        )}
                      </td>

                      {/* Ukuran */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold">
                          {ord.ukuran}
                        </span>
                      </td>

                      {/* Furing */}
                      <td className="py-3 px-3">
                        {ord.furing === "pakai" ? (
                          <span className="text-emerald-400">Pakai Furing</span>
                        ) : (
                          <span className="text-gray-400">Tanpa Furing</span>
                        )}
                      </td>

                      {/* Desain Belakang */}
                      <td className="py-3 px-3">
                        {ord.desainBelakang === "bordir" ? (
                          <span className="text-amber-400 font-semibold">
                            Bordir (+20k)
                          </span>
                        ) : (
                          <span className="text-gray-300">Sablon</span>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-3 text-center font-bold text-white">
                        {ord.qty} pcs
                      </td>

                      {/* Total Biaya */}
                      <td className="py-3 px-4 font-bold text-[#C44341]">
                        {formatCurrency(ord.totalHarga)}
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

                      {/* Aksi Hapus */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={updatingId === ord.id}
                          onClick={() => handleDelete(ord)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-white transition-colors cursor-pointer text-xs"
                          title="Hapus Pesanan"
                        >
                          🗑️
                        </button>
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
