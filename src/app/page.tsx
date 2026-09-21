"use client";

import React, { useState } from "react";
import profileData from "@/data/profile.json";
import { ProfileData } from "@/types/profile";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import EventsSection from "@/components/sections/EventsSection";
import JoinSection from "@/components/sections/JoinSection";
import Lightbox, { LightboxImage } from "@/components/gallery/Lightbox";
import EventStoryModal from "@/components/events/EventStoryModal";

const profile = profileData as ProfileData;

export default function HomePage() {
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);

  // Story Poster Modal State
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [storyEventName, setStoryEventName] = useState("");

  // Handler for Event photo click (supports multiple photos per event)
  const handleOpenEventPhoto = (photos: string[] | string, eventName: string) => {
    const photoList = Array.isArray(photos) ? photos : [photos];
    setLightboxImages(
      photoList.map((src, idx) => ({
        src,
        alt: `Foto kegiatan ${eventName} - ${idx + 1}`,
        title: eventName,
        caption: `Dokumentasi ${eventName} (${idx + 1}/${photoList.length})`,
      }))
    );
    setLightboxIndex(0);
    setIsLightboxOpen(true);
  };

  // Handler for Event Story poster click
  const handleOpenStory = (imageSrc: string, eventName: string) => {
    setStoryImage(imageSrc);
    setStoryEventName(eventName);
    setStoryModalOpen(true);
  };

  return (
    <>
      {/* Top Header Navigation */}
      <Header profile={profile} />

      {/* Main Single Page Sections */}
      <main className="flex-1 w-full">
        <HeroSection profile={profile} />
        <AboutSection profile={profile} />
        <EventsSection
          events={profile.events}
          onOpenStory={handleOpenStory}
          onOpenPhoto={handleOpenEventPhoto}
        />
        <JoinSection community={profile.community} brand={profile.brand} />
      </main>

      {/* Footer */}
      <Footer profile={profile} />

      {/* Lightbox Modal */}
      <Lightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

      {/* Event Story Poster Modal */}
      <EventStoryModal
        isOpen={storyModalOpen}
        imageSrc={storyImage}
        eventName={storyEventName}
        onClose={() => setStoryModalOpen(false)}
      />
    </>
  );
}
