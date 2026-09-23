import React from "react";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import BekasiWeatherWidget from "@/components/weather/BekasiWeatherWidget";

export default function WeatherSection() {
  return (
    <section
      id="cuaca"
      className="scroll-mt-16 sm:scroll-mt-20 relative min-h-screen sm:min-h-[100vh] py-24 sm:py-32 md:py-40 flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background Artwork: Cyclists checking weather forecast on phone */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/background/weather-bg.webp"
          alt="Prakiraan Cuaca Gowes Tiba-Tiba Cycling Bekasi"
          fill
          sizes="100vw"
          className="object-cover object-[center_55%] md:object-[center_48%]"
          priority
        />
        {/* Dark Gradient Overlay matching other sections */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8">
          <SectionHeading
            number="04"
            tag="Prakiraan Cuaca & Kualitas Udara"
            title="Cuaca & Udara Gowes Bekasi"
            subtitle="Prakiraan cuaca & indeks kualitas udara (AQI) pagi akhir pekan (05:30 – 08:30 WIB) di seluruh penjuru Bekasi."
            theme="dark"
            subtitleClassName="text-white font-medium"
            className="mb-0"
          />
        </div>

        {/* 4-Region Weekend Weather Widget */}
        <BekasiWeatherWidget />
      </div>
    </section>
  );
}
