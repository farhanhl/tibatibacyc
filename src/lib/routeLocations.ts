import { CoordinatePoint, EventItem } from "@/types/profile";
export type { CoordinatePoint };

export interface LocationPreset {
  name: string;
  category: "start" | "cafe" | "landmark" | "route";
  lat: number;
  lng: number;
}

// Lokasi preset resmi komunitas Tiba-Tiba Cycling (Bekasi & Sekitarnya)
export const PRESET_LOCATIONS: LocationPreset[] = [
  {
    name: "Alfamidi Depan Tol Bekasi Timur (Meeting Point Utama)",
    category: "start",
    lat: -6.2648671,
    lng: 107.0169006,
  },
  {
    name: "Situ Cibeureum",
    category: "landmark",
    lat: -6.2980556,
    lng: 107.0455556,
  },
  {
    name: "Kopi Tuku Vida",
    category: "cafe",
    lat: -6.313454,
    lng: 107.008124,
  },
  {
    name: "Kopitagram Vida Bekasi",
    category: "cafe",
    lat: -6.313768,
    lng: 107.008432,
  },
  {
    name: "Kopi Kalean Kebonjati",
    category: "cafe",
    lat: -6.2227052,
    lng: 107.0885664,
  },
  {
    name: "Kopi Calf Jatiwarna",
    category: "cafe",
    lat: -6.289158,
    lng: 106.915626,
  },
  {
    name: "Susy Garden",
    category: "cafe",
    lat: -6.325599,
    lng: 106.9281809,
  },
  {
    name: "Kopi Nako Kota Bintang",
    category: "cafe",
    lat: -6.249497,
    lng: 106.966952,
  },
  {
    name: "Warkop Beels",
    category: "cafe",
    lat: -6.257630,
    lng: 107.014264,
  },
  {
    name: "Car Free Day Summarecon Bekasi",
    category: "landmark",
    lat: -6.225579,
    lng: 106.999676,
  },
  {
    name: "ICM (Stadion Patriot Bekasi)",
    category: "landmark",
    lat: -6.236687,
    lng: 106.992645,
  },
];

export const DEFAULT_START_COORDINATES: CoordinatePoint = {
  lat: -6.2648671,
  lng: 107.0169006,
  name: "Alfamidi Depan Tol Bekasi Timur",
};

/**
 * Mencari atau memperkirakan koordinat lokasi berdasarkan nama teks
 */
export function getCoordinatesFromName(text: string, fallback: CoordinatePoint = DEFAULT_START_COORDINATES): CoordinatePoint {
  const clean = text.toLowerCase();

  for (const loc of PRESET_LOCATIONS) {
    const locClean = loc.name.toLowerCase();
    if (clean.includes(locClean.split("(")[0].trim().toLowerCase()) || locClean.includes(clean)) {
      return { lat: loc.lat, lng: loc.lng, name: loc.name };
    }
  }

  if (clean.includes("situ cibeureum") || clean.includes("situ cibereum")) {
    return { lat: -6.2980556, lng: 107.0455556, name: "Situ Cibeureum" };
  }
  if (clean.includes("tuku")) {
    return { lat: -6.313454, lng: 107.008124, name: "Kopi Tuku Vida" };
  }
  if (clean.includes("kopitagram")) {
    return { lat: -6.313768, lng: 107.008432, name: "Kopitagram Vida Bekasi" };
  }
  if (clean.includes("kalean") || clean.includes("kebonjati")) {
    return { lat: -6.2227052, lng: 107.0885664, name: "Kopi Kalean Kebonjati" };
  }
  if (clean.includes("calf") || clean.includes("jatiwarna")) {
    return { lat: -6.289158, lng: 106.915626, name: "Kopi Calf Jatiwarna" };
  }
  if (clean.includes("susy") || clean.includes("garden")) {
    return { lat: -6.325599, lng: 106.9281809, name: "Susy Garden" };
  }
  if (clean.includes("nako") || clean.includes("bintang")) {
    return { lat: -6.249497, lng: 106.966952, name: "Kopi Nako Kota Bintang" };
  }
  if (clean.includes("beels") || clean.includes("warkop")) {
    return { lat: -6.257630, lng: 107.014264, name: "Warkop Beels" };
  }
  if (clean.includes("summarecon") || clean.includes("cfd")) {
    return { lat: -6.225579, lng: 106.999676, name: "Car Free Day Summarecon Bekasi" };
  }
  if (clean.includes("icm") || clean.includes("critical mass") || clean.includes("patriot")) {
    return { lat: -6.236687, lng: 106.992645, name: "ICM (Stadion Patriot Bekasi)" };
  }

  return {
    lat: fallback.lat,
    lng: fallback.lng,
    name: text,
  };
}

/**
 * Mendapatkan jalur koordinat lengkap untuk satu Event spesifik
 */
export function getEventRoutePoints(event: EventItem): CoordinatePoint[] {
  if (event.waypoints && event.waypoints.length >= 2) {
    return event.waypoints;
  }

  const start = event.startCoordinates || DEFAULT_START_COORDINATES;
  const destination = event.destinationCoordinates || getCoordinatesFromName(event.name, {
    lat: -6.2980556,
    lng: 107.0455556,
    name: event.name,
  });

  return [
    { ...start, name: event.startLocation || "Alfamidi Depan Tol Bekasi Timur" },
    { ...destination, name: event.name || "Destinasi Akhir" },
  ];
}

/**
 * Mendapatkan rute jelajah lengkap (Grand Tour) 100% MURNI dari database Firebase Firestore.
 * Tidak ada lagi pemanggilan atau list destinasi yang di-hardcode dalam script.
 */
export function getGrandTourRoutePoints(events: EventItem[]): {
  points: CoordinatePoint[];
  eventStops: { index: number; event: EventItem }[];
} {
  if (!events || events.length === 0) {
    return { points: [], eventStops: [] };
  }

  // Titik awal diambil dari startCoordinates kegiatan di Firestore, atau DEFAULT_START_COORDINATES
  const firstEventWithStart = events.find((e) => e.startCoordinates);
  const startPt: CoordinatePoint = firstEventWithStart?.startCoordinates || {
    ...DEFAULT_START_COORDINATES,
    name: firstEventWithStart?.startLocation || DEFAULT_START_COORDINATES.name,
  };

  const points: CoordinatePoint[] = [startPt];
  const eventStops: { index: number; event: EventItem }[] = [];

  // Urutkan kegiatan berdasarkan tanggal secara kronologis (dari awal hingga akhir)
  const sortedEvents = [...events].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  for (const ev of sortedEvents) {
    // 1. Ambil koordinat destinasi murni dari data Firebase
    let destCoord: CoordinatePoint | null = null;

    if (
      ev.destinationCoordinates &&
      typeof ev.destinationCoordinates.lat === "number" &&
      typeof ev.destinationCoordinates.lng === "number" &&
      (ev.destinationCoordinates.lat !== 0 || ev.destinationCoordinates.lng !== 0)
    ) {
      destCoord = {
        lat: ev.destinationCoordinates.lat,
        lng: ev.destinationCoordinates.lng,
        name: ev.destinationCoordinates.name || ev.name,
      };
    } else if (ev.waypoints && ev.waypoints.length > 0) {
      const lastWp = ev.waypoints[ev.waypoints.length - 1];
      destCoord = {
        lat: lastWp.lat,
        lng: lastWp.lng,
        name: lastWp.name || ev.name,
      };
    } else if (ev.name) {
      // Fallback jika kegiatan di Firestore belum diisi koordinat manual
      destCoord = getCoordinatesFromName(ev.name);
    }

    if (destCoord && destCoord.lat && destCoord.lng) {
      // Hindari duplikasi beruntun jika koordinat identik
      const prevPt = points[points.length - 1];
      const isDuplicate =
        Math.abs(prevPt.lat - destCoord.lat) < 0.0001 &&
        Math.abs(prevPt.lng - destCoord.lng) < 0.0001;

      if (!isDuplicate) {
        points.push(destCoord);
        eventStops.push({ index: points.length - 1, event: ev });
      }
    }
  }

  // Jika terdapat minimal 2 destinasi kegiatan, buat rute berputar kembali ke titik kumpul utama
  if (points.length >= 3) {
    points.push({
      lat: startPt.lat,
      lng: startPt.lng,
      name: `Kembali ke ${startPt.name || "Titik Kumpul"} ☕`,
    });
  }

  return { points, eventStops };
}

/**
 * Mengambil geometri rute jalan raya asli (jalan beraspal, belokan, jembatan) dari OpenStreetMap OSRM
 */
const routeCache = new Map<string, CoordinatePoint[]>();

export async function fetchRealRoadRoute(waypoints: CoordinatePoint[]): Promise<CoordinatePoint[]> {
  if (waypoints.length < 2) return waypoints;

  const cacheKey = waypoints.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const coordsParam = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM request failed");

    const data = await res.json();
    if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
      const rawCoords: [number, number][] = data.routes[0].geometry.coordinates;
      const roadPoints: CoordinatePoint[] = rawCoords.map(([lng, lat]) => ({
        lat,
        lng,
      }));

      // Tempelkan nama waypoint terdekat ke titik jalan raya
      for (const wp of waypoints) {
        if (wp.name) {
          let closestIdx = 0;
          let minDistance = Infinity;
          for (let i = 0; i < roadPoints.length; i++) {
            const dLat = roadPoints[i].lat - wp.lat;
            const dLng = roadPoints[i].lng - wp.lng;
            const dist = dLat * dLat + dLng * dLng;
            if (dist < minDistance) {
              minDistance = dist;
              closestIdx = i;
            }
          }
          roadPoints[closestIdx].name = wp.name;
        }
      }

      routeCache.set(cacheKey, roadPoints);
      return roadPoints;
    }
  } catch (err) {
    console.warn("Gagal mengambil rute jalan dari OSRM, fallback ke interpolasi:", err);
  }

  // Fallback jika koneksi rute gagal
  const fallback = interpolateRoute(waypoints, 30);
  routeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Interpolasi titik halus sepanjang polyline untuk fallback
 */
export function interpolateRoute(points: CoordinatePoint[], stepsPerSegment: number = 30): CoordinatePoint[] {
  if (points.length < 2) return points;

  const result: CoordinatePoint[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      result.push({
        lat: p1.lat + (p2.lat - p1.lat) * t,
        lng: p1.lng + (p2.lng - p1.lng) * t,
        name: t < 0.5 ? p1.name : p2.name,
      });
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

