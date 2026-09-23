import profileData from "@/data/profile.json";
import { ProfileData, EventItem, GalleryItem } from "@/types/profile";

export function getProfile(): ProfileData {
  return profileData as unknown as ProfileData;
}

export function getEvents(): EventItem[] {
  const profile = getProfile();
  return profile.events || [];
}

export function getEventBySlug(slug: string): EventItem | undefined {
  const events = getEvents();
  return events.find((e) => e.slug === slug || e.id === slug);
}

export function getUpcomingEvents(): EventItem[] {
  return getEvents().filter((e) => e.status === "upcoming");
}

export function getCompletedEvents(): EventItem[] {
  return getEvents().filter((e) => e.status === "completed");
}

export function getGallery(): GalleryItem[] {
  const profile = getProfile();
  return profile.gallery || [];
}
