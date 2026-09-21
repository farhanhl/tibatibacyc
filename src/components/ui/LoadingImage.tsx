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
                <div className="relative w-16 h-14 sm:w-20 sm:h-16">
                  <svg
                    viewBox="0 0 64 64"
                    className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Road Line with Moving Dashes beneath bike */}
                    <line
                      x1="4"
                      y1="56"
                      x2="60"
                      y2="56"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      strokeOpacity="0.3"
                      className="animate-road-dash"
                    />

                    {/* Rear Wheel (White Rim with rotating spokes) */}
                    <g className="animate-spin-wheel" style={{ transformOrigin: "16px 44px" }}>
                      <circle cx="16" cy="44" r="11" stroke="#FFFFFF" strokeWidth="2.5" />
                      <circle cx="16" cy="44" r="11" stroke="#C44341" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <line x1="16" y1="33" x2="16" y2="55" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                      <line x1="5" y1="44" x2="27" y2="44" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                      <circle cx="16" cy="44" r="2.5" fill="#FFFFFF" />
                    </g>

                    {/* Front Wheel (White Rim with rotating spokes) */}
                    <g className="animate-spin-wheel" style={{ transformOrigin: "48px 44px" }}>
                      <circle cx="48" cy="44" r="11" stroke="#FFFFFF" strokeWidth="2.5" />
                      <circle cx="48" cy="44" r="11" stroke="#C44341" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <line x1="48" y1="33" x2="48" y2="55" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                      <line x1="37" y1="44" x2="59" y2="44" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                      <circle cx="48" cy="44" r="2.5" fill="#FFFFFF" />
                    </g>

                    {/* White Bicycle Chassis */}
                    <path
                      d="M16 44 L32 44 L44 26 L26 26 Z"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M32 44 L28 22"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M48 44 L44 24 L48 20"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M46 19 C49 19 52 21 51 24"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Red Cyclist Character with Waiting/Breathing Bounce */}
                    <g className="animate-cyclist-bounce">
                      {/* Red Helmet */}
                      <circle cx="37" cy="11" r="5" fill="#C44341" />
                      <circle cx="36" cy="11" r="4.5" fill="#A93434" />
                      <path d="M34 9 Q38 6 42 11" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

                      {/* Red Torso / Jersey */}
                      <path
                        d="M36 15 L28 24 L38 28"
                        stroke="#C44341"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Red Arms */}
                      <path
                        d="M35 17 L44 22 L48 21"
                        stroke="#C44341"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Red Legs Waiting on Pedal */}
                      <path
                        d="M28 24 L33 33 L32 44"
                        stroke="#C44341"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </svg>
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
