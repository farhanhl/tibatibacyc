import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "red" | "dark" | "outline" | "completed" | "upcoming";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "red",
  size = "md",
  className = "",
}: BadgeProps) {
  const sizeClasses =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm";

  let variantClasses = "";
  switch (variant) {
    case "red":
      variantClasses = "bg-[#C44341] text-white font-semibold";
      break;
    case "dark":
      variantClasses = "bg-[#0E1426] text-white font-medium";
      break;
    case "outline":
      variantClasses =
        "border border-[#D8D2D2] text-[#111111] bg-white/80 backdrop-blur-xs font-medium";
      break;
    case "completed":
      variantClasses = "bg-black/60 text-[#EAE6DD] border border-white/20 font-bold backdrop-blur-md";
      break;
    case "upcoming":
      variantClasses = "bg-[#C44341] text-white font-bold tracking-wide shadow-md";
      break;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm uppercase tracking-wider ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
