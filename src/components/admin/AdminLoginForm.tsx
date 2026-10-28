"use client";

import React, { useState } from "react";
import Image from "next/image";

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setIsLoading(true);
    setPinError(false);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-[#EAE6DD] flex items-center justify-center p-4">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-black/65 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C44341] flex items-center justify-center text-3xl text-white mx-auto shadow-xl">
          🔐
        </div>

        <div>
          <h1
            className="text-2xl font-black uppercase text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Admin Panel
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Masukkan PIN rahasia untuk mengelola jadwal kegiatan dan merchandise
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Masukkan PIN Admin..."
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              className={`w-full px-4 py-3 bg-black/80 border rounded-xl text-center font-mono text-lg text-white focus:outline-none transition-all ${
                pinError
                  ? "border-red-500 ring-2 ring-red-500/30"
                  : "border-white/20 focus:border-[#C44341]"
              }`}
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-400 font-mono mt-2 animate-bounce">
                ❌ PIN salah! Silakan periksa kembali.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#C44341] hover:bg-[#A93434] disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-sm shadow-lg hover:shadow-[#C44341]/50"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isLoading ? "Memverifikasi..." : "Buka Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}

