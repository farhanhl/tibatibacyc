export interface SiteInfo {
  name: string;
  shortName: string;
  founded: string;
  location: string;
  description: string;
  areas: string[];
}

export interface BrandInfo {
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  quote: string;
  bikePolicy: string;
}

export interface Pillar {
  title: string;
  description: string;
}

export interface AboutInfo {
  title: string;
  lead: string;
  description: string;
  extended?: string;
  pillars: Pillar[];
}

export interface SocialAccount {
  username: string;
  url: string;
}

export interface SocialInfo {
  instagram: SocialAccount;
  tiktok: SocialAccount;
}

export interface CommunityInfo {
  heading: string;
  tagline: string;
  description: string;
  joinLabel: string;
  joinUrl: string;
  guidelines: string[];
}

export interface EventItem {
  id: string;
  slug: string;
  name: string;
  date: string;
  time: string;
  startLocation: string;
  distance?: string;
  description?: string;
  bikePolicy?: string;
  photos: string[];
  instastoryImage?: string;
  status: "upcoming" | "completed" | "cancelled";
  badge?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  date: string;
  category: string;
  image: string;
}

export interface ProfileData {
  site: SiteInfo;
  brand: BrandInfo;
  about: AboutInfo;
  social: SocialInfo;
  community: CommunityInfo;
  events: EventItem[];
  gallery?: GalleryItem[];
}
