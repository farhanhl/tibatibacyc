"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { TwibbonTemplate } from "./types";

interface TwibbonEditorProps {
  templates: TwibbonTemplate[];
}

export default function TwibbonEditor({ templates }: TwibbonEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TwibbonTemplate>(
    templates[0] || {
      id: "default",
      name: "Tiba-Tiba Cycling Frame",
      filename: "twibbon 1.png",
      src: "/images/twibbon/twibbon%201.png",
      width: 941,
      height: 1672,
      aspectRatio: 941 / 1672,
    }
  );

  // Twibbon Dropdown selector state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // User uploaded image state
  const [userImageElement, setUserImageElement] = useState<HTMLImageElement | null>(null);

  // Frame overlay state
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);

  // Transformation states
  const [scale, setScale] = useState<number>(1);
  const [baseFitScale, setBaseFitScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>("transparent");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Interaction states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [posStart, setPosStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "error">("success");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Show a timed toast
  const showToast = useCallback((msg: string, type: "success" | "info" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Preload frame overlay
  useEffect(() => {
    let isCancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = selectedTemplate.src;
    img.onload = () => {
      if (!isCancelled) {
        setFrameImage(img);
      }
    };
    return () => {
      isCancelled = true;
    };
  }, [selectedTemplate.src]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle template selection via dropdown
  const handleSelectTemplate = (tpl: TwibbonTemplate) => {
    setSelectedTemplate(tpl);
    setIsDropdownOpen(false);

    // If user has uploaded an image, adapt scale and position to the new frame dimensions
    if (userImageElement) {
      const targetW = tpl.width;
      const targetH = tpl.height;
      const fitScale = Math.max(
        targetW / userImageElement.naturalWidth,
        targetH / userImageElement.naturalHeight
      );
      setBaseFitScale(fitScale);
      setScale(fitScale);
      setPosition({ x: 0, y: 0 });
    }
    showToast(`Frame "${tpl.name}" dipilih`, "info");
  };

  // Main drawing routine
  const drawToContext = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      exportMode = false
    ) => {
      // 1. Clear background
      ctx.clearRect(0, 0, w, h);

      // 2. Draw user-selected background color if not transparent
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }

      // 3. Draw User Image with transformations
      if (userImageElement) {
        ctx.save();
        // Move origin to center + user pan offset
        ctx.translate(w / 2 + position.x, h / 2 + position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -scale : scale, flipV ? -scale : scale);

        // Draw centered
        const nw = userImageElement.naturalWidth;
        const nh = userImageElement.naturalHeight;
        ctx.drawImage(userImageElement, -nw / 2, -nh / 2, nw, nh);
        ctx.restore();
      }

      // 4. Draw Twibbon Frame Overlay on top
      if (frameImage && frameImage.complete) {
        ctx.drawImage(frameImage, 0, 0, w, h);
      }

      // 5. Draw helper grid if enabled (only on preview, never on export)
      if (showGuide && !exportMode) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);

        // Rule of thirds
        ctx.beginPath();
        // Vertical lines
        ctx.moveTo(w / 3, 0);
        ctx.lineTo(w / 3, h);
        ctx.moveTo((w * 2) / 3, 0);
        ctx.lineTo((w * 2) / 3, h);
        // Horizontal lines
        ctx.moveTo(0, h / 3);
        ctx.lineTo(w, h / 3);
        ctx.moveTo(0, (h * 2) / 3);
        ctx.lineTo(w, (h * 2) / 3);
        ctx.stroke();

        // Center crosshair
        ctx.strokeStyle = "rgba(196, 67, 65, 0.7)";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(w / 2 - 24, h / 2);
        ctx.lineTo(w / 2 + 24, h / 2);
        ctx.moveTo(w / 2, h / 2 - 24);
        ctx.lineTo(w / 2, h / 2 + 24);
        ctx.stroke();

        ctx.restore();
      }
    },
    [
      bgColor,
      userImageElement,
      position.x,
      position.y,
      rotation,
      flipH,
      flipV,
      scale,
      frameImage,
      showGuide,
    ]
  );

  // Trigger preview canvas update
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const w = selectedTemplate.width;
    const h = selectedTemplate.height;

    if (cvs.width !== w) cvs.width = w;
    if (cvs.height !== h) cvs.height = h;

    drawToContext(ctx, w, h, false);
  }, [selectedTemplate.width, selectedTemplate.height, drawToContext]);

  // Process uploaded image file
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Harap pilih file gambar (JPG, PNG, atau WEBP).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        setUserImageElement(img);

        // Auto-fit photo to cover template frame
        const targetW = selectedTemplate.width;
        const targetH = selectedTemplate.height;
        const fitScale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);

        setBaseFitScale(fitScale);
        setScale(fitScale);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        showToast("Foto berhasil dimuat! Geser atau zoom untuk menyesuaikan.", "success");
      };
    };
    reader.readAsDataURL(file);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop file upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Mouse & Touch Pan Handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!userImageElement) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPosStart({ ...position });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = selectedTemplate.width / rect.width;

    const dx = (e.clientX - dragStart.x) * scaleFactor;
    const dy = (e.clientY - dragStart.y) * scaleFactor;

    setPosition({
      x: posStart.x + dx,
      y: posStart.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture release fallback
      }
    }
  };

  // Wheel Zoom (Mouse wheel)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!userImageElement) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
    setScale((prev) => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(next, baseFitScale * 0.2), baseFitScale * 4);
    });
  };

  // Touch Pinch-to-zoom (2 fingers on mobile)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && pinchDistance !== null) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / pinchDistance;
      setScale((prev) => {
        const next = prev * ratio;
        return Math.min(Math.max(next, baseFitScale * 0.2), baseFitScale * 4);
      });
      setPinchDistance(currentDist);
    }
  };

  const handleTouchEnd = () => {
    setPinchDistance(null);
  };

  // Quick Action Buttons
  const handleFitCover = () => {
    if (!userImageElement) return;
    const fitScale = Math.max(
      selectedTemplate.width / userImageElement.naturalWidth,
      selectedTemplate.height / userImageElement.naturalHeight
    );
    setBaseFitScale(fitScale);
    setScale(fitScale);
    setPosition({ x: 0, y: 0 });
    showToast("Foto dipusatkan dan disesuaikan ke frame.", "info");
  };

  const handleResetAll = () => {
    if (!userImageElement) return;
    handleFitCover();
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    showToast("Pengaturan foto direset.", "info");
  };

  const handleRotate90 = (direction: "cw" | "ccw") => {
    setRotation((prev) => {
      const delta = direction === "cw" ? 90 : -90;
      let next = (prev + delta) % 360;
      if (next > 180) next -= 360;
      if (next < -180) next += 360;
      return next;
    });
  };

  // Generate full-resolution export blob
  const generateExportBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const offscreen = document.createElement("canvas");
      const w = selectedTemplate.width;
      const h = selectedTemplate.height;
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d");
      if (!ctx) {
        reject(new Error("Gagal menginisialisasi canvas context"));
        return;
      }
      drawToContext(ctx, w, h, true);
      offscreen.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Gagal membuat gambar"));
        }
      }, "image/png");
    });
  };

  // Download twibbon
  const handleDownload = async () => {
    if (!userImageElement) {
      showToast("Silakan upload foto kamu terlebih dahulu!", "info");
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      const blob = await generateExportBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = selectedTemplate.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      a.href = url;
      a.download = `tibatiba-cycling-${safeName}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Twibbon HD berhasil diunduh! Siap diposting.", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunduh gambar. Silakan coba lagi.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Copy image to clipboard
  const handleCopyClipboard = async () => {
    if (!userImageElement) {
      showToast("Silakan upload foto kamu terlebih dahulu!", "info");
      return;
    }

    try {
      if (typeof window !== "undefined" && "ClipboardItem" in window && navigator.clipboard?.write) {
        setIsExporting(true);
        const blob = await generateExportBlob();
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        showToast("Gambar berhasil disalin ke papan klip (clipboard)!", "success");
      } else {
        showToast("Fitur salin gambar tidak didukung di browser ini. Gunakan tombol Unduh.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal menyalin gambar ke clipboard.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Web Share API
  const handleShare = async () => {
    if (!userImageElement) {
      showToast("Silakan upload foto kamu terlebih dahulu!", "info");
      return;
    }

    try {
      const blob = await generateExportBlob();
      const file = new File([blob], "tibatiba-cycling-twibbon.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Twibbon Tiba-Tiba Cycling Bekasi",
          text: "Siap gowes bareng Tiba-Tiba Cycling! 🚴‍♂️💨 #TibaTibaCycling #GowesBekasi",
        });
        showToast("Berhasil dibagikan!", "success");
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error(err);
        showToast("Gagal membagikan twibbon.", "error");
      }
    }
  };

  // Calculate zoom percentage relative to base fit
  const zoomPercent = Math.round((scale / (baseFitScale || 1)) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-5 py-3 rounded-lg shadow-2xl border text-sm font-medium flex items-center gap-3 backdrop-blur-md ${
              toastType === "success"
                ? "bg-[#0E1426]/95 border-[#C44341] text-white"
                : toastType === "error"
                ? "bg-red-950/90 border-red-500 text-red-200"
                : "bg-black/90 border-white/20 text-[#EAE6DD]"
            }`}
          >
            {toastType === "success" && (
              <svg className="w-5 h-5 text-[#C44341] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Grid: Left = Canvas Preview (Sticky on Desktop), Right = Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ================= LEFT COLUMN: CANVAS PREVIEW ================= */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center">
          {/* Card Container */}
          <div className="w-full bg-[#0E1426] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl relative">
            {/* Header info bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C44341] animate-pulse" />
                <span className="font-mono text-white font-semibold">TWIBBON</span>
              </div>
            </div>

            {/* Interactive Canvas Area */}
            <div
              ref={containerRef}
              className={`relative mx-auto rounded-xl overflow-hidden shadow-2xl bg-black border border-white/15 transition-all select-none ${
                userImageElement ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
              }`}
              style={{
                aspectRatio: `${selectedTemplate.aspectRatio}`,
                maxHeight: "min(68vh, 600px)",
                width: "auto",
              }}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => {
                if (!userImageElement) {
                  fileInputRef.current?.click();
                }
              }}
            >
              {/* Canvas Element */}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain block touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />

              {/* Empty State Overlay (Upload prompt) */}
              {!userImageElement && (
                <div
                  className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center transition-all ${
                    isDragOver ? "bg-[#C44341]/25 backdrop-blur-sm" : "bg-black/60 hover:bg-black/50 backdrop-blur-[2px]"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#C44341] flex items-center justify-center text-white mb-4 shadow-xl shadow-[#C44341]/40 transform group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3
                    className="text-lg sm:text-xl font-bold uppercase text-white tracking-wide mb-1"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Klik untuk Upload Foto
                  </h3>
                </div>
              )}

              {/* Floating Quick Action Overlay on Canvas */}
              {userImageElement && (
                <div className="absolute top-3 inset-x-3 pointer-events-none flex items-center justify-between z-10">
                  <div className="pointer-events-auto bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/15 text-[11px] font-mono text-white flex items-center gap-1.5">
                    <span>Zoom:</span>
                    <span className="text-[#C44341] font-bold">{zoomPercent}%</span>
                  </div>
                  <div className="pointer-events-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowGuide(!showGuide)}
                      title="Toggle Garis Bantu (Rule of Thirds)"
                      className={`p-1.5 rounded-md backdrop-blur-md border text-xs transition-colors cursor-pointer ${
                        showGuide
                          ? "bg-[#C44341] border-[#C44341] text-white"
                          : "bg-black/75 border-white/15 text-[#868B96] hover:text-white"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleFitCover}
                      title="Pusatkan Foto"
                      className="p-1.5 rounded-md bg-black/75 hover:bg-black border border-white/15 text-[#868B96] hover:text-white backdrop-blur-md text-xs transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Drag instruction pill at bottom
              {userImageElement && (
                <div className="absolute bottom-3 inset-x-0 pointer-events-none flex justify-center z-10">
                  <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[11px] font-medium text-[#EAE6DD]/90 shadow-lg flex items-center gap-1.5">
                    <span>✋</span> Geser langsung untuk memindahkan foto
                  </div>
                </div>
              )} */}
            </div>

            {/* Quick action bar below canvas */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#C44341] transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {userImageElement ? "Ganti Foto" : "Pilih Foto"}
              </button>

              {userImageElement && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="text-xs text-[#868B96] hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserImageElement(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1 font-mono"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CONTROLS & SETTINGS ================= */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          {/* 1. Template Frame Selection via Dropdown */}
          <div className="bg-[#0E1426] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-3">
              <label
                id="twibbon-select-label"
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#C44341] flex items-center gap-1.5"
              >
                <span>01.</span> PILIH FRAME TWIBBON
              </label>
              <span className="text-[11px] font-mono text-[#868B96]">
                {templates.length} Pilihan Tersedia
              </span>
            </div>

            {/* Custom Interactive Dropdown Component */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                aria-labelledby="twibbon-select-label"
                className={`w-full flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C44341] ${
                  isDropdownOpen
                    ? "bg-black/90 border-[#C44341] ring-1 ring-[#C44341] shadow-lg shadow-[#C44341]/10"
                    : "bg-black/50 border-white/15 hover:border-white/30 hover:bg-black/70"
                }`}
              >
                {/* Selected Item Preview */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-10 h-14 rounded-md overflow-hidden bg-black shrink-0 border border-white/20">
                    <Image
                      src={selectedTemplate.src}
                      alt={selectedTemplate.name}
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm sm:text-base font-bold text-white uppercase truncate block"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {selectedTemplate.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C44341] text-white shrink-0">
                        AKTIF
                      </span>
                    </div>
                    {/* <p className="text-xs text-[#868B96] font-mono mt-0.5 flex items-center gap-2 truncate">
                      <span>📱 9:16 Story</span>
                      <span>•</span>
                      <span>{selectedTemplate.width} × {selectedTemplate.height} px</span>
                    </p> */}
                  </div>
                </div>

                {/* Dropdown Chevron Arrow */}
                <div className="shrink-0 pl-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#EAE6DD] transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180 text-[#C44341] border-[#C44341]/50 bg-[#C44341]/10" : ""
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Dropdown Menu Options */}
              {isDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute top-full mt-2 inset-x-0 z-30 bg-[#0E1426]/98 backdrop-blur-xl border border-[#C44341]/40 rounded-xl shadow-2xl p-2 space-y-1.5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/50"
                >
                  {templates.map((tpl) => {
                    const isSelected = tpl.id === selectedTemplate.id;
                    return (
                      <div
                        key={tpl.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#C44341]/20 border-[#C44341] text-white"
                            : "bg-black/40 border-transparent hover:border-white/10 hover:bg-white/5 text-[#EAE6DD]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-8 h-12 rounded overflow-hidden bg-black shrink-0 border border-white/10">
                            <Image
                              src={tpl.src}
                              alt={tpl.name}
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs sm:text-sm font-bold uppercase truncate"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {tpl.name}
                              </span>
                            </div>
                            {/* <div className="text-[11px] font-mono text-[#868B96]">
                              {tpl.width} × {tpl.height} px • 9:16
                            </div> */}
                          </div>
                        </div>

                        {/* Checkmark icon for selected option */}
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-[#C44341] text-white flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[#868B96] opacity-0 group-hover:opacity-100">
                            Pilih
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 2. Photo Adjustments (Zoom, Rotate, Mirror) */}
          <div className="bg-[#0E1426] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <label
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#C44341] flex items-center gap-1.5"
              >
                <span>02.</span> ATUR POSISI & UKURAN
              </label>
              {/* {!userImageElement && (
                <span className="text-[11px] font-mono text-[#868B96] italic">
                  Upload foto untuk mengaktifkan
                </span>
              )} */}
            </div>

            {/* A. Zoom Slider & Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                  Zoom (Perbesar / Perkecil)
                </span>
                <span className="font-mono text-[#C44341] font-bold">{zoomPercent}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!userImageElement}
                  onClick={() => setScale((prev) => Math.max(prev * 0.9, baseFitScale * 0.2))}
                  className="w-9 h-9 rounded-lg bg-black/60 hover:bg-black border border-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                  title="Perkecil (-10%)"
                >
                  −
                </button>
                <input
                  type="range"
                  disabled={!userImageElement}
                  min={baseFitScale * 0.2}
                  max={baseFitScale * 4}
                  step={baseFitScale * 0.02}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-[#C44341] h-2 bg-black/60 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={!userImageElement}
                  onClick={() => setScale((prev) => Math.min(prev * 1.1, baseFitScale * 4))}
                  className="w-9 h-9 rounded-lg bg-black/60 hover:bg-black border border-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                  title="Perbesar (+10%)"
                >
                  +
                </button>
              </div>
            </div>

            {/* B. Rotate Slider & Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
                  Rotasi Foto
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#C44341] font-bold">{rotation}°</span>
                  {rotation !== 0 && (
                    <button
                      type="button"
                      onClick={() => setRotation(0)}
                      className="text-[10px] font-mono text-[#868B96] hover:text-white underline cursor-pointer"
                    >
                      Reset 0°
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={!userImageElement}
                  onClick={() => handleRotate90("ccw")}
                  className="px-3 py-2 bg-black/60 hover:bg-black border border-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  -90°
                </button>
                <button
                  type="button"
                  disabled={!userImageElement}
                  onClick={() => handleRotate90("cw")}
                  className="px-3 py-2 bg-black/60 hover:bg-black border border-white/15 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                  +90°
                </button>
                <div className="col-span-2 flex items-center">
                  <input
                    type="range"
                    disabled={!userImageElement}
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="w-full accent-[#C44341] h-2 bg-black/60 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* C. Mirror & Flip Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={!userImageElement}
                onClick={() => setFlipH(!flipH)}
                className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  flipH
                    ? "bg-[#C44341] border-[#C44341] text-white"
                    : "bg-black/60 border-white/15 text-[#EAE6DD] hover:bg-black"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Putar Horizontal
              </button>

              <button
                type="button"
                disabled={!userImageElement}
                onClick={() => setFlipV(!flipV)}
                className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  flipV
                    ? "bg-[#C44341] border-[#C44341] text-white"
                    : "bg-black/60 border-white/15 text-[#EAE6DD] hover:bg-black"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Putar Vertikal
              </button>
            </div>

            {/* D. Background Fill (If image does not cover frame fully)
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-[#868B96] font-mono">Warna Latar Belakang:</span>
              <div className="flex items-center gap-2">
                {[
                  { label: "Transparan", val: "transparent" },
                  { label: "Hitam", val: "#000000" },
                  { label: "Navy", val: "#0E1426" },
                  { label: "Putih", val: "#FFFFFF" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setBgColor(item.val)}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      bgColor === item.val
                        ? "ring-2 ring-[#C44341] scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: item.val === "transparent" ? "#222" : item.val,
                      backgroundImage:
                        item.val === "transparent"
                          ? "radial-gradient(circle, #555 10%, transparent 20%)"
                          : undefined,
                    }}
                    title={item.label}
                  />
                ))}
              </div>
            </div> */}
          </div>

          {/* 3. Export & Download Actions */}
          <div className="bg-[#0E1426] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <label
                className="text-xs font-mono font-bold uppercase tracking-wider text-[#C44341] flex items-center gap-1.5"
              >
                <span>03.</span> SIMPAN & BAGIKAN
              </label>
            </div>

            {/* Main Download Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="w-full py-4 px-6 bg-[#C44341] hover:bg-[#A93434] active:scale-[0.99] text-white rounded-xl shadow-xl shadow-[#C44341]/30 transition-all font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Memproses Twibbon...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Unduh Twibbon HD
                </>
              )}
            </button>

            {/* Secondary Action Buttons: Copy & Share
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isExporting || !userImageElement}
                onClick={handleCopyClipboard}
                className="py-3 px-4 bg-black/60 hover:bg-black border border-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <svg className="w-4 h-4 text-[#C44341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Salin Gambar
              </button>

              <button
                type="button"
                disabled={isExporting || !userImageElement}
                onClick={handleShare}
                className="py-3 px-4 bg-black/60 hover:bg-black border border-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <svg className="w-4 h-4 text-[#C44341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Bagikan
              </button>
            </div> */}

            {/* Note & File info */}
            <p className="text-[11px] text-[#868B96] text-center font-mono">
              Format PNG berkualitas tinggi ({selectedTemplate.width} × {selectedTemplate.height} px), cocok untuk Instagram Story & WhatsApp Status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
