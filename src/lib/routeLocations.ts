import { CoordinatePoint, EventItem } from "@/types/profile";
export type { CoordinatePoint };

// Titik kumpul default utama (Meeting Point Alfamidi Bekasi Timur)
export const DEFAULT_START_COORDINATES: CoordinatePoint = {
  lat: -6.2648671,
  lng: 107.0169006,
  name: "Alfamidi Depan Tol Bekasi Timur",
};

/**
 * Mendapatkan jalur koordinat lengkap untuk satu Event spesifik (100% murni dari database Firebase)
 */
export function getEventRoutePoints(event: EventItem): CoordinatePoint[] {
  if (event.waypoints && event.waypoints.length >= 2) {
    return event.waypoints;
  }

  const start = event.startCoordinates || DEFAULT_START_COORDINATES;
  const destination = event.destinationCoordinates;

  if (
    destination &&
    typeof destination.lat === "number" &&
    typeof destination.lng === "number" &&
    (destination.lat !== 0 || destination.lng !== 0)
  ) {
    return [
      { ...start, name: event.startLocation || start.name || "Titik Kumpul" },
      { ...destination, name: event.name || destination.name || "Destinasi Akhir" },
    ];
  }

  return [
    { ...start, name: event.startLocation || start.name || "Titik Kumpul" },
  ];
}

/**
 * Mendapatkan rute jelajah lengkap (Grand Tour) 100% MURNI dari data Firebase Firestore.
 * Tidak ada pemanggilan preset ataupun hardcoded destinasi dalam script.
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
    }

    if (destCoord && destCoord.lat && destCoord.lng) {
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
