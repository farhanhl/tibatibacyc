"use client";

import React, { useEffect, useState, useRef } from "react";

export default function ScrollCyclistProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const currentProgress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
          setScrollProgress(currentProgress);
        }

        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 300);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="fixed top-16 sm:top-20 left-0 w-full z-40 pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Background Track Line */}
      <div className="w-full h-[2px] bg-white/10 relative overflow-visible">
        {/* Active Red Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-[#C44341] via-[#E63946] to-[#C44341] shadow-[0_0_8px_rgba(196,67,65,0.8)] transition-[width] duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Animated Cyclist Sprite Container riding right on the progress tip */}
        <div
          className="absolute top-0 -translate-y-full transition-[left] duration-75 ease-out flex flex-col items-center"
          style={{
            left: `calc(${scrollProgress}% - ${scrollProgress > 95 ? "38px" : scrollProgress < 5 ? "4px" : "20px"})`,
          }}
        >
          {/* Mini Percentage Badge during active scrolling */}
          <div
            className={`mb-1 px-1.5 py-0.5 rounded bg-black/90 text-[#EAE6DD] text-[9px] font-mono font-bold tracking-wider border border-[#C44341]/60 shadow-md transition-all duration-300 flex items-center gap-1 ${
              isScrolling || scrollProgress > 0 ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C44341] animate-pulse" />
            <span>{Math.round(scrollProgress)}%</span>
          </div>

          {/* SVG Cyclist Figure with Rotating Wheels & Cadence */}
          <div className={`relative w-8 h-8 sm:w-9 sm:h-9 ${isScrolling ? "cyclist-riding" : ""}`}>
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Rear Wheel (White Rim & Spokes) */}
              <g className={`wheel-rear ${isScrolling ? "animate-spin-wheel" : ""}`} style={{ transformOrigin: "16px 44px" }}>
                <circle cx="16" cy="44" r="11" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="16" cy="44" r="11" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <line x1="16" y1="33" x2="16" y2="55" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                <line x1="5" y1="44" x2="27" y2="44" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                <circle cx="16" cy="44" r="2.5" fill="#FFFFFF" />
              </g>

              {/* Front Wheel (White Rim & Spokes) */}
              <g className={`wheel-front ${isScrolling ? "animate-spin-wheel" : ""}`} style={{ transformOrigin: "48px 44px" }}>
                <circle cx="48" cy="44" r="11" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="48" cy="44" r="11" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <line x1="48" y1="33" x2="48" y2="55" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                <line x1="37" y1="44" x2="59" y2="44" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
                <circle cx="48" cy="44" r="2.5" fill="#FFFFFF" />
              </g>

              {/* Bike Frame / Chassis (Pure White) */}
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
              {/* Handlebar (White) */}
              <path
                d="M46 19 C49 19 52 21 51 24"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Cyclist Body (Brand Red) with Cadence Animation */}
              <g className={isScrolling ? "animate-cyclist-bounce" : ""}>
                {/* Cyclist Helmet & Head (Red with white aerodynamic line) */}
                <circle cx="37" cy="11" r="5" fill="#C44341" />
                <circle cx="36" cy="11" r="4.5" fill="#A93434" />
                <path d="M34 9 Q38 6 42 11" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

                {/* Torso & Cycling Jersey (Red) */}
                <path
                  d="M36 15 L28 24 L38 28"
                  stroke="#C44341"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Arm reaching handlebar (Red) */}
                <path
                  d="M35 17 L44 22 L48 21"
                  stroke="#C44341"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Legs & Pedaling action (Red) */}
                <path
                  d="M28 24 L33 33 L32 44"
                  stroke="#C44341"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isScrolling ? "animate-pedal-leg" : ""}
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
