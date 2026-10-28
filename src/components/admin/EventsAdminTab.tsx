"use client";

import React from "react";
import Image from "next/image";
import { EventItem } from "@/types/profile";
import {
  formatIndonesianFullDate,
  calculateDaysRemaining,
  getDaysDifference,
} from "@/lib/scheduleService";

interface EventsAdminTabProps {
  events: EventItem[];
  upcomingEventsCount: number;
  eventEditingId: string | null;
  eventFormData: Omit<EventItem, "id">;
  setEventFormData: React.Dispatch<React.SetStateAction<Omit<EventItem, "id">>>;
  isFormDateUpcoming: boolean;
  isLoading: boolean;
  isUploadingPhotos: boolean;
  isUploadingStory: boolean;
  uploadStatusText: string;
  onSaveEvent: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onEditEvent: (item: EventItem) => void;
  onDeleteEvent: (id: string) => void;
  onTogglePopup: (item: EventItem) => void;
  onUploadPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadStory: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
}

export default function EventsAdminTab({
  events,
  upcomingEventsCount,
  eventEditingId,
  eventFormData,
  setEventFormData,
  isFormDateUpcoming,
  isLoading,
  isUploadingPhotos,
  isUploadingStory,
  uploadStatusText,
  onSaveEvent,
  onCancelEdit,
  onEditEvent,
  onDeleteEvent,
  onTogglePopup,
  onUploadPhotos,
  onUploadStory,
  onRemovePhoto,
}: EventsAdminTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
      {/* Form Column */}
      <div className="lg:col-span-5 bg-black/55 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl space-y-5 overflow-hidden min-w-0">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2
              className="text-lg font-black uppercase text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {eventEditingId ? "✏️ Edit Kegiatan / Jadwal" : "➕ Tambah Kegiatan / Jadwal Baru"}
            </h2>
            <p className="text-[11px] text-gray-400 font-mono">
              Status otomatis diatur berdasarkan tanggal
            </p>
          </div>
          {eventEditingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={onSaveEvent} className="space-y-4 text-xs font-mono w-full min-w-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full">
            <div className="min-w-0 w-full">
              <label className="block text-gray-300 mb-1">TANGGAL GOWES *</label>
              <input
                type="date"
                required
                value={eventFormData.date}
                onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                className="block w-full max-w-full min-w-0 box-border px-3.5 py-2.5 min-h-[42px] [color-scheme:dark] bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-[#C44341]"
              />
            </div>
            <div className="min-w-0 w-full">
              <label className="block text-gray-300 mb-1">JAM KUMPUL</label>
              <input
                type="text"
                value={eventFormData.time}
                onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                placeholder="05:30 WIB"
                className="block w-full max-w-full min-w-0 box-border px-3.5 py-2.5 min-h-[42px] bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 w-full">
            <div className="min-w-0 w-full">
              <label className="block text-gray-300 mb-1">TITIK KUMPUL (START) *</label>
              <input
                type="text"
                required
                value={eventFormData.startLocation}
                onChange={(e) =>
                  setEventFormData({ ...eventFormData, startLocation: e.target.value })
                }
                placeholder="Alfamidi Bekasi Timur"
                className="block w-full max-w-full min-w-0 box-border px-3.5 py-2.5 min-h-[42px] bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
              />
            </div>
            <div className="min-w-0 w-full">
              <label className="block text-gray-300 mb-1">JARAK TEMPUH</label>
              <input
                type="text"
                value={eventFormData.distance}
                onChange={(e) => setEventFormData({ ...eventFormData, distance: e.target.value })}
                placeholder="25 KM"
                className="block w-full max-w-full min-w-0 box-border px-3.5 py-2.5 min-h-[42px] bg-black/60 border border-white/20 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#C44341]"
              />
            </div>
          </div>

          {/* Koordinat Destinasi untuk Peta */}
          <div className="p-3.5 bg-black/60 border border-white/15 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-gray-300 font-bold flex items-center gap-1.5 text-xs">
                <span>📍</span>
                <span>Koordinat Destinasi Peta (Tersimpan di Firebase)</span>
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Latitude & Longitude</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div>
                <span className="text-gray-400 block mb-1">Destinasi Latitude (Lat) *</span>
                <input
                  type="number"
                  step="any"
                  placeholder="-6.289158"
                  value={eventFormData.destinationCoordinates?.lat || ""}
                  onChange={(e) =>
                    setEventFormData((prev) => ({
                      ...prev,
                      destinationCoordinates: {
                        lat: parseFloat(e.target.value) || 0,
                        lng: prev.destinationCoordinates?.lng || 0,
                        name: prev.destinationCoordinates?.name || prev.name,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-black/80 border border-white/20 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#C44341]"
                />
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Destinasi Longitude (Lng) *</span>
                <input
                  type="number"
                  step="any"
                  placeholder="106.915626"
                  value={eventFormData.destinationCoordinates?.lng || ""}
                  onChange={(e) =>
                    setEventFormData((prev) => ({
                      ...prev,
                      destinationCoordinates: {
                        lat: prev.destinationCoordinates?.lat || 0,
                        lng: parseFloat(e.target.value) || 0,
                        name: prev.destinationCoordinates?.name || prev.name,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-black/80 border border-white/20 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#C44341]"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500">
              💡 Cara cari koordinat: Buka Google Maps, klik kanan tempat tujuan lalu pilih angka koordinat untuk disalin (contoh: -6.289158, 106.915626).
            </p>
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

          {/* Toggle Pengingat Pop-up H-5 */}
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
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, showPopup: e.target.checked })
                  }
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
                <span className="text-[11px] text-gray-400">
                  Upload beberapa foto sekaligus ke Cloudinary
                </span>
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
              onChange={onUploadPhotos}
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
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-white/20 aspect-video bg-black"
                    >
                      <Image
                        src={photoUrl}
                        alt={`Foto ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(idx)}
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
                <span className="text-gray-200 font-bold block">
                  📱 Poster Cerita / Flyer (Format 9:16)
                </span>
                <span className="text-[11px] text-gray-400">
                  Upload poster kegiatan vertikal dalam format 9:16 (Instagram Story)
                </span>
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
              onChange={onUploadStory}
              className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
            />

            {eventFormData.instastoryImage && (
              <div className="space-y-1 mt-2">
                <div
                  className="relative inline-block rounded-xl overflow-hidden border border-white/20 w-28 aspect-[9/16] bg-black shadow-lg"
                  style={{ aspectRatio: "9 / 16" }}
                >
                  <Image
                    src={eventFormData.instastoryImage}
                    alt="Poster cerita"
                    fill
                    className="object-contain"
                    sizes="112px"
                  />
                  <div className="absolute bottom-1 left-1 right-1 bg-black/80 rounded px-1 text-[9px] text-center font-mono text-gray-300 pointer-events-none">
                    9:16
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEventFormData({ ...eventFormData, instastoryImage: "" })
                    }
                    className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white p-1 rounded-md text-[10px] cursor-pointer shadow-md transition-colors"
                    title="Hapus poster ini"
                  >
                    ✕
                  </button>
                </div>
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
            {isLoading
              ? "Menyimpan..."
              : eventEditingId
              ? "Simpan Perubahan Kegiatan"
              : "Publikasikan Kegiatan & Jadwal"}
          </button>
        </form>
      </div>

      {/* List Column */}
      <div className="lg:col-span-7 space-y-4">
        <div className="border-b border-white/10 pb-3">
          <h2
            className="text-lg font-black uppercase text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            📋 Daftar Seluruh Kegiatan & Jadwal ({events.length})
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Kegiatan mendatang ({upcomingEventsCount}) otomatis menampilkan opsi pop-up reminder
          </p>
        </div>

        {events.length === 0 ? (
          <div className="p-10 bg-black/55 backdrop-blur-md rounded-2xl border border-white/20 text-center space-y-3">
            <div className="text-3xl">🚴‍♂️</div>
            <p className="text-base text-gray-200 font-bold">
              Belum ada kegiatan tersimpan di database
            </p>
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
                const countdown = calculateDaysRemaining(item.date, item.time);
                const fullDate = formatIndonesianFullDate(item.date);
                const thumbnail =
                  item.photos && item.photos.length > 0 ? item.photos[0] : null;
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
                            onClick={() => onTogglePopup(item)}
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
                          onClick={() => onEditEvent(item)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => onDeleteEvent(item.id)}
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
  );
}

