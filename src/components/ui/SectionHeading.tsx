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
      className={`mb-8 sm:mb-12 ${
        isCenter ? "text-center mx-auto max-w-3xl items-center flex flex-col" : "text-left"
      } ${className}`}
    >
      {/* Top Meta Line: Number + Tag */}
      {(number || tag) && (
        <div
          className={`flex items-center gap-3 mb-3 text-xs sm:text-sm font-semibold tracking-widest uppercase font-mono ${
            isDark ? "text-[#C44341]" : "text-[#C44341]"
          }`}
        >
          {number && (
            <span className="inline-block px-2 py-0.5 bg-[#C44341]/10 text-[#C44341] rounded font-bold border border-[#C44341]/20">
              {number}
            </span>
          )}
          {tag && <span>{tag}</span>}
          <span className="w-8 h-[2px] bg-[#C44341] inline-block" />
        </div>
      )}

      {/* Main Headline */}
      <h2
        className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.05] ${
          isDark ? "text-white" : "text-[#000000]"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>

      {/* Subtitle / Description */}
      {subtitle && (
        <p
          className={`mt-4 text-base sm:text-lg max-w-2xl leading-relaxed ${
            subtitleClassName
              ? subtitleClassName
              : isDark
              ? "text-[#EAE6DD]"
              : "text-[#666666]"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
