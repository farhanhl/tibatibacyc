"use client";

import React, { useState, useEffect } from "react";
import { MerchandiseOrder } from "@/types/merchandise";
import { subscribeMerchandiseOrders } from "@/lib/merchandiseService";

export default function MerchandisePublicOrders() {
  const [orders, setOrders] = useState<MerchandiseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMerchandiseOrders((data) => {
      setOrders(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalPcs = orders.reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalOrders = orders.length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: MerchandiseOrder["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            Terkonfirmasi
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 border border-blue-500/40 text-blue-400">
            Selesai / Terkirim
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 border border-red-500/40 text-red-400">
            Dibatalkan
          </span>
        );
      case "pending":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400">
            Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-[#12141A] border border-white/15 space-y-6 shadow-2xl">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C44341]/15 border border-[#C44341]/40 text-[#C44341] text-xs font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />
            Live List Pre-Order
          </div>
          <h3
            className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Daftar Pesanan Rompi Batch #1
          </h3>
          <p className="text-xs text-gray-400">
            Transparansi rekap pemesanan rompi Tiba-Tiba Cycling. Data diperbarui secara otomatis dan langsung tercatat.
          </p>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-center">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">Total Pemesan</span>
            <span
              className="text-2xl sm:text-3xl font-black text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {totalOrders}
            </span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-center">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">Total Rompi</span>
            <span
              className="text-2xl sm:text-3xl font-black text-[#C44341]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {totalPcs} <span className="text-xs font-mono font-normal text-gray-400">pcs</span>
            </span>
          </div>
        </div>
      </div>

      {/* Orders Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
          <div className="w-7 h-7 border-2 border-[#C44341] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Memuat daftar pemesan...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 px-4 rounded-xl bg-black/40 border border-dashed border-white/10 text-center space-y-3">
          <span className="text-4xl block">👕</span>
          <h4 className="text-sm font-bold text-white uppercase font-mono">
            Belum Ada Pesanan yang Tercatat
          </h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Jadilah yang pertama untuk ikut memesan Rompi Eksklusif Tiba-Tiba Cycling Batch #1! Isi formulir di atas sekarang.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/80 text-gray-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">Nama Pemesan</th>
                <th className="py-3 px-4 text-center">Ukuran</th>
                <th className="py-3 px-4">Furing</th>
                <th className="py-3 px-4">Desain Belakang</th>
                <th className="py-3 px-4 text-center">Jumlah</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {orders.map((ord, idx) => (
                <tr key={ord.id || idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 text-center text-gray-500 font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[11px] text-[#C44341] font-black">
                      {ord.nama ? ord.nama.charAt(0).toUpperCase() : "🚴"}
                    </span>
                    <span>{ord.nama}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-bold">
                      {ord.ukuran}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {ord.furing === "pakai" ? (
                      <span className="text-emerald-400">Pakai Furing</span>
                    ) : (
                      <span className="text-gray-400">Tanpa Furing</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {ord.desainBelakang === "bordir" ? (
                      <span className="text-amber-400 font-semibold">Bordir (+20k)</span>
                    ) : (
                      <span className="text-gray-300">Sablon</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-white">
                    {ord.qty} pcs
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">
                    {formatDate(ord.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(ord.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
