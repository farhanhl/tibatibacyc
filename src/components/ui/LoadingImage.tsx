"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface LoadingImageProps extends ImageProps {
  wrapperClassName?: string;
  spinnerSize?: "sm" | "md" | "lg";
}

export default function LoadingImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  spinnerSize = "md",
  onLoad,
  ...props
}: LoadingImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset loading state if src changes (e.g. in Lightbox slides)
  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  const spinnerDimensions = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[spinnerSize];

  return (
    <div className={`relative overflow-hidden w-full h-full ${wrapperClassName}`}>
      {/* Loading Skeleton with Animated Waiting Cyclist */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 backdrop-blur-xs">
          {/* Shimmer gradient wave */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

          {/* Cyclist Loading Content */}
          <div className="relative flex flex-col items-center justify-center gap-2 z-10 p-3">
            {spinnerSize === "sm" ? (
              /* Compact spinning wheel for tiny thumbnails */
              <div className="relative w-6 h-6 animate-spin text-[#C44341]">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-[0_0_6px_#C44341]">
                  <circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.4" />
                  <circle cx="12" cy="12" r="9" stroke="#C44341" strokeWidth="2" strokeDasharray="6 6" />
                  <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
                </svg>
              </div>
            ) : (
              /* Waiting Cyclist Animated Character for card & modal images */
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-cyclist-bounce">
                  <Image
                    src="/images/cyclist.png"
                    alt="Memuat foto..."
                    fill
                    sizes="(max-width: 640px) 64px, 80px"
                    className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                    priority
                  />
                </div>

                {/* Waiting Gowes Status Text */}
                <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-black/80 border border-white/10 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C44341] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#EAE6DD] uppercase">
                    Menyiapkan Foto
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actual Image with smooth fade-in */}
      <Image
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-500 ease-in-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        {...props}
      />
    </div>
  );
}
