import type { Metadata, Viewport } from "next";
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import profile from "@/data/profile.json";
import VisitorTracker from "@/components/analytics/VisitorTracker";
import RideReminderModal from "@/components/modal/RideReminderModal";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#C44341",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.tibatibacyc.my.id"),
  title: `${profile.site.name} — Komunitas Sepeda di Bekasi`,
  description: `${profile.site.description} Berdiri sejak ${profile.site.founded}. ${profile.brand.tagline}`,
  keywords: [
    "Tiba-Tiba Cycling",
    "Komunitas Sepeda Bekasi",
    "Gowes Bekasi",
    "Cycling Community Bekasi",
    "Gowes Akhir Pekan Bekasi",
    "Bekasi Timur",
    "Bekasi Barat",
    "Bekasi Selatan",
    "Road Bike Bekasi",
    "Sepeda Lipat Bekasi",
    "Gravel Bekasi",
    "Weekend Ride Bekasi",
    "Komunitas Gowes",
    "Kota Patriot",
  ],
  authors: [{ name: profile.site.name, url: "https://www.tibatibacyc.my.id" }],
  creator: profile.site.name,
  publisher: profile.site.name,
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://www.tibatibacyc.my.id/",
    siteName: profile.site.name,
    title: `${profile.site.name} — Komunitas Sepeda di Bekasi`,
    description: `${profile.brand.tagline} ${profile.brand.heroDescription}`,
    images: [
      {
        url: "/images/logo.png",
        width: 1024,
        height: 1024,
        type: "image/png",
        alt: `${profile.site.name} Bekasi`,
      },
      {
        url: "/images/logo.webp",
        width: 1024,
        height: 1024,
        type: "image/webp",
        alt: `${profile.site.name} Bekasi`,
      },
      {
        url: "/images/logo.jpg",
        width: 1024,
        height: 1024,
        type: "image/jpeg",
        alt: `${profile.site.name} Bekasi`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.site.name} — Komunitas Sepeda di Bekasi`,
    description: profile.brand.tagline,
    images: ["/images/logo.png"],
  },
  alternates: {
    canonical: "https://www.tibatibacyc.my.id/",
  },
  icons: {
    icon: [
      { url: "/images/logo.webp", type: "image/webp" },
      { url: "/images/logo.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/images/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Structured Data for Rich Snippets & AI Search Crawlers (ChatGPT, Perplexity, Gemini, Claude, Google AI)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsClub",
        "@id": "https://www.tibatibacyc.my.id/#organization",
        "name": profile.site.name,
        "alternateName": "Tiba-Tiba Cycling Bekasi",
        "url": "https://www.tibatibacyc.my.id",
        "logo": "https://www.tibatibacyc.my.id/images/logo.png",
        "image": "https://www.tibatibacyc.my.id/images/logo.png",
        "description": profile.site.description,
        "slogan": profile.brand.tagline,
        "foundingDate": "2026-07-01",
        "sport": "Cycling",
        "knowsAbout": [
          "Bersepeda",
          "Komunitas Sepeda Bekasi",
          "Road Bike",
          "Sepeda Lipat",
          "Gravel Bike",
          "Mountain Bike",
          "Group Ride",
          "Peloton Ride Bekasi"
        ],
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Bekasi",
          "addressRegion": "Jawa Barat",
          "addressCountry": "ID"
        },
        "areaServed": profile.site.areas.map((area) => ({
          "@type": "AdministrativeArea",
          "name": area
        })),
        "sameAs": [
          profile.social.instagram.url,
          profile.social.tiktok.url
        ].filter(Boolean)
      },
      {
        "@type": "WebSite",
        "@id": "https://www.tibatibacyc.my.id/#website",
        "url": "https://www.tibatibacyc.my.id",
        "name": profile.site.name,
        "description": profile.site.description,
        "publisher": {
          "@id": "https://www.tibatibacyc.my.id/#organization"
        },
        "inLanguage": "id-ID"
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.tibatibacyc.my.id/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apa itu Tiba-Tiba Cycling?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tiba-Tiba Cycling adalah komunitas pesepeda di Bekasi yang berdiri sejak Juli 2026. Komunitas ini mewadahi berbagai pesepeda untuk menikmati kegiatan gowes bersama di akhir pekan dengan prinsip santai, seru, dan terbuka untuk semua jenis sepeda."
            }
          },
          {
            "@type": "Question",
            "name": "Jenis sepeda apa saja yang boleh ikut gowes di Tiba-Tiba Cycling?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Semua jenis sepeda boleh ikut! Mulai dari road bike, sepeda lipat (folding bike), gravel bike, mountain bike (MTB), fixie, hingga sepeda harian/commuter."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa biaya untuk bergabung dengan komunitas Tiba-Tiba Cycling?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Pendaftaran anggota Tiba-Tiba Cycling 100% gratis dan terbuka untuk umum (Open Member). Cukup bawa sepeda dan perlengkapan keselamatan seperti helm."
            }
          },
          {
            "@type": "Question",
            "name": "Di mana saja rute dan titik kumpul gowes Tiba-Tiba Cycling?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Rute gowes mencakup wilayah Bekasi Timur, Bekasi Barat, dan Bekasi Selatan dengan titik kumpul populer di Summarecon Bekasi (SMB), Grand Galaxy City, dan Bulak Kapal."
            }
          }
        ]
      },
      {
        "@type": "ItemList",
        "name": "Kegiatan Gowes Tiba-Tiba Cycling",
        "itemListElement": profile.events.map((event, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "SportsEvent",
            "name": event.name,
            "startDate": `${event.date}T${event.time.replace(" WIB", ":00+07:00")}`,
            "location": {
              "@type": "Place",
              "name": event.startLocation,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Bekasi",
                "addressCountry": "ID"
              }
            },
            "sport": "Cycling",
            "organizer": {
              "@id": "https://www.tibatibacyc.my.id/#organization"
            }
          }
        }))
      }
    ]
  };

  return (
    <html lang="id" className={`${oswald.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#000000] text-[#EAE6DD] antialiased min-h-screen flex flex-col font-sans">
        <VisitorTracker />
        <RideReminderModal />
        {children}
      </body>
    </html>
  );
}
