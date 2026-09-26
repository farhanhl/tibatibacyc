"use client";

import React, { useState, useEffect } from "react";
import profileData from "@/data/profile.json";
import { ProfileData, EventItem } from "@/types/profile";
import { getEventsFromDb } from "@/lib/eventsService";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import EventsSection from "@/components/sections/EventsSection";
import RouteMapSection from "@/components/sections/RouteMapSection";
import WeatherSection from "@/components/sections/WeatherSection";
import JoinSection from "@/components/sections/JoinSection";
import Lightbox, { LightboxImage } from "@/components/gallery/Lightbox";
import EventStoryModal from "@/components/events/EventStoryModal";
import ScrollCyclistProgress from "@/components/ui/ScrollCyclistProgress";

const profile = profileData as ProfileData;

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    getEventsFromDb().then((data) => {
      setEvents(data);
      setIsLoadingEvents(false);
    });
  }, []);

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

      {/* Interactive Scroll Cyclist Progress Tracker */}
      <ScrollCyclistProgress />

      {/* Main Single Page Sections */}
      <main className="flex-1 w-full">
        <HeroSection profile={profile} />
        <AboutSection profile={profile} />
        <EventsSection
          events={events}
          isLoading={isLoadingEvents}
          onOpenStory={handleOpenStory}
          onOpenPhoto={handleOpenEventPhoto}
        />
        <RouteMapSection
          events={events}
          isLoading={isLoadingEvents}
          onOpenPhoto={handleOpenEventPhoto}
          onOpenStory={handleOpenStory}
        />
        <JoinSection community={profile.community} brand={profile.brand} />
        <WeatherSection />
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
