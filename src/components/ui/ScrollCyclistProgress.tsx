"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";

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
          className="absolute bottom-0 transition-[left] duration-75 ease-out flex flex-col items-center"
          style={{
            left: `calc(${scrollProgress}% - ${scrollProgress > 95 ? "44px" : scrollProgress < 5 ? "8px" : "24px"})`,
          }}
        >
          {/* Official Community Cyclist Illustration Sprite */}
          <div
            className={`relative w-11 h-11 sm:w-13 sm:h-13 transition-transform duration-200 ${
              isScrolling ? "animate-cyclist-bounce scale-105" : "scale-100"
            }`}
          >
            <Image
              src="/images/cyclist.png"
              alt="Cyclist Progress Indicator"
              fill
              sizes="(max-width: 640px) 44px, 52px"
              className="object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
