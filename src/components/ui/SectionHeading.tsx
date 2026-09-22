import React from "react";

interface SectionHeadingProps {
  number?: string;
  tag?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
  subtitleClassName?: string;
}

export default function SectionHeading({
  number,
  tag,
  title,
  subtitle,
  align = "left",
  theme = "light",
  className = "",
  subtitleClassName = "",
}: SectionHeadingProps) {
  const isDark = theme === "dark";
  const isCenter = align === "center";

  return (
    <div
      className={`mb-8 sm:mb-12 ${isCenter ? "text-center mx-auto max-w-3xl items-center flex flex-col" : "text-left"
        } ${className}`}
    >
      {/* Top Meta Line: Number + Tag with clear background */}
      {(number || tag) && (
        <div className="flex items-center gap-2.5 mb-2.5">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border text-xs sm:text-sm font-semibold tracking-wider uppercase font-mono shadow-md ${isDark
                ? "bg-black/80 border-white/20 text-[#EAE6DD]"
                : "bg-white/95 border-black/15 text-[#111111]"
              }`}
          >
            {number && (
              <span className="inline-block px-2 py-0.5 bg-[#C44341] text-white rounded-full font-bold text-[11px] sm:text-xs tracking-normal shadow-xs">
                {number}
              </span>
            )}
            {tag && <span className="font-bold tracking-wider">{tag}</span>}
          </div>
        </div>
      )}

      {/* Main Headline */}
      <h2
        className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.05] ${isDark ? "text-white" : "text-[#000000]"
          }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>

      {/* Subtitle / Description */}
      {subtitle && (
        <p
          className={`mt-1 sm:mt-1.5 text-sm sm:text-base max-w-2xl leading-snug ${isDark
              ? "text-[#EAE6DD]"
              : "text-[#666666]"
            } ${subtitleClassName}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
