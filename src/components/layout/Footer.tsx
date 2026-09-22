"use client";

import React from "react";
import Image from "next/image";
import { ProfileData } from "@/types/profile";

interface FooterProps {
  profile: ProfileData;
}

export default function Footer({ profile }: FooterProps) {
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
  };
  return (
    <footer className="bg-[#000000] text-white border-t-4 border-[#C44341]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C44341] bg-black">
                <Image
                  src="/images/logo.webp"
                  alt={`${profile.site.name} Logo`}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span
                className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {profile.site.name}
              </span>
            </div>

            <p
              className="text-lg sm:text-xl font-bold text-[#C44341] uppercase tracking-wide"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {profile.brand.tagline}
            </p>

            <p className="text-sm text-[#868B96] max-w-md leading-relaxed">
              {profile.site.description}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-[#868B96]">
              {profile.site.areas.map((area) => (
                <span key={area} className="px-2.5 py-1 bg-[#0E1426] rounded border border-white/10">
                  📍 {area}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="md:col-span-3 space-y-3">
            <h3
              className="text-base font-bold text-white uppercase tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Navigasi
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#home"
                  onClick={handleHomeClick}
                  className="text-[#868B96] hover:text-[#C44341] transition-colors cursor-pointer"
                >
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-[#868B96] hover:text-[#C44341] transition-colors">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="#events" className="text-[#868B96] hover:text-[#C44341] transition-colors">
                  Kegiatan Gowes
                </a>
              </li>
              <li>
                <a href="#join" className="text-[#868B96] hover:text-[#C44341] transition-colors">
                  Gabung Komunitas
                </a>
              </li>
              <li>
                <a href="#cuaca" className="text-[#868B96] hover:text-[#C44341] transition-colors">
                  Cuaca Gowes
                </a>
              </li>
            </ul>
          </div>

          {/* Social Connections */}
          <div className="md:col-span-3 space-y-3">
            <h3
              className="text-base font-bold text-white uppercase tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sosial Media
            </h3>
            <div className="flex flex-col gap-2.5">
              {/* Instagram */}
              {profile.social.instagram.url && (
                <a
                  href={profile.social.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-sm text-[#EAE6DD] hover:text-white transition-colors p-2.5 bg-[#0E1426] rounded border border-white/10 hover:border-[#C44341] group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#C44341]/20 group-hover:bg-[#C44341] flex items-center justify-center transition-colors shrink-0">
                    <svg className="w-4 h-4 text-[#C44341] group-hover:text-white fill-current transition-colors" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs">{profile.social.instagram.username}</span>
                </a>
              )}

              {/* TikTok */}
              {profile.social.tiktok.url && (
                <a
                  href={profile.social.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-sm text-[#EAE6DD] hover:text-white transition-colors p-2.5 bg-[#0E1426] rounded border border-white/10 hover:border-[#C44341] group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#C44341]/20 group-hover:bg-[#C44341] flex items-center justify-center transition-colors shrink-0">
                    <svg className="w-4 h-4 text-[#C44341] group-hover:text-white fill-current transition-colors" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs">{profile.social.tiktok.username}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#868B96] font-mono gap-4">
          <p>© 2026 {profile.site.name}. All rights reserved.</p>
          <p className="text-[#868B96]/80">{profile.site.location}</p>
        </div>
      </div>
    </footer>
  );
}
