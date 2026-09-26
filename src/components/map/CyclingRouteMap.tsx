"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EventItem, CoordinatePoint } from "@/types/profile";
import {
  getEventRoutePoints,
  getGrandTourRoutePoints,
  fetchRealRoadRoute,
} from "@/lib/routeLocations";
import { formatIndonesianFullDate, getDaysDifference } from "@/lib/scheduleService";

interface CyclingRouteMapProps {
  events: EventItem[];
  selectedEventId?: string;
  onSelectEvent?: (event: EventItem) => void;
  onOpenPhoto?: (photos: string[] | string, title: string) => void;
  onOpenStory?: (imageSrc: string, title: string) => void;
}

function getShortPlaceName(name: string): string {
  let clean = name.replace(/^tiba[- ]tiba\s*(ke\s*)?/i, "").trim();
  if (clean.toLowerCase().includes("situ cibereum lagi")) return "Situ Cibeureum Lagi";
  if (clean.toLowerCase().includes("situ cibeureum")) return "Situ Cibeureum";
  if (clean.toLowerCase().includes("kopi tuku")) return "Kopi Tuku Vida";
  if (clean.toLowerCase().includes("kopitagram")) return "Kopitagram Vida";
  if (clean.toLowerCase().includes("kopi kalean")) return "Kopi Kalean";
  if (clean.toLowerCase().includes("kopi nako")) return "Kopi Nako";
  if (clean.toLowerCase().includes("susy garden")) return "Susy Garden";
  if (clean.toLowerCase().includes("warkop beels")) return "Warkop Beels";
  if (clean.toLowerCase().includes("car free day") || clean.toLowerCase().includes("summarecon")) return "CFD Summarecon";
  if (clean.toLowerCase().includes("critical mass") || clean.toLowerCase().includes("icm")) return "ICM Bekasi";
  return clean.length > 18 ? clean.substring(0, 16) + "..." : clean;
}

interface InterpolatedPosition {
  lat: number;
  lng: number;
  segIndex: number;
  movingWest: boolean;
}

function getPositionAtDistance(
  dist: number,
  points: CoordinatePoint[],
  dists: number[],
  totalDist: number
): InterpolatedPosition {
  if (dist <= 0 || points.length < 2) {
    const movingWest = points.length >= 2 ? points[1].lng < points[0].lng : false;
    return { lat: points[0].lat, lng: points[0].lng, segIndex: 0, movingWest };
  }
  if (dist >= totalDist) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    return {
      lat: last.lat,
      lng: last.lng,
      segIndex: points.length - 2,
      movingWest: last.lng < prev.lng,
    };
  }

  // Binary search to find segment
  let low = 0;
  let high = dists.length - 2;
  let seg = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (dists[mid] <= dist && dist <= dists[mid + 1]) {
      seg = mid;
      break;
    } else if (dists[mid] < dist) {
      seg = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const p1 = points[seg];
  const p2 = points[seg + 1];
  const segDist = dists[seg + 1] - dists[seg];
  const factor = segDist > 0.0001 ? (dist - dists[seg]) / segDist : 0;

  const lat = p1.lat + (p2.lat - p1.lat) * factor;
  const lng = p1.lng + (p2.lng - p1.lng) * factor;
  const movingWest = p2.lng < p1.lng;

  return { lat, lng, segIndex: seg, movingWest };
}

export default function CyclingRouteMap({
  events,
  selectedEventId,
  onSelectEvent,
  onOpenPhoto,
  onOpenStory,
}: CyclingRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Mode: "grand-tour" (Jelajah Berantai) | event.id (Destinasi Spesifik)
  const [activeRouteMode, setActiveRouteMode] = useState<string>("grand-tour");

  // Sync state if external prop changes
  useEffect(() => {
    if (selectedEventId) {
      setActiveRouteMode(selectedEventId);
    }
  }, [selectedEventId]);

  const activeEvent = useMemo(() => {
    if (activeRouteMode === "grand-tour") return null;
    return events.find((e) => e.id === activeRouteMode) || null;
  }, [events, activeRouteMode]);

  // Animation playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [followCyclist, setFollowCyclist] = useState<boolean>(false);
  const [currentProgressPct, setCurrentProgressPct] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>("Memuat rute jalan...");
  const [roadPoints, setRoadPoints] = useState<CoordinatePoint[]>([]);
  const [isLoadingRoads, setIsLoadingRoads] = useState<boolean>(false);

  // Refs for continuous sub-millimeter animation loop & layers
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const progressDistRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);
  const isRestartingRef = useRef<boolean>(false);
  const cyclistMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const activeTrailPolylineRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Key landmarks / waypoints
  const rawWaypoints = useMemo(() => {
    if (activeRouteMode === "grand-tour") {
      const { points } = getGrandTourRoutePoints(events);
      return points;
    } else if (activeEvent) {
      return getEventRoutePoints(activeEvent);
    }
    return [];
  }, [activeRouteMode, activeEvent, events]);

  // Fetch real road geometry (following real streets, highways, turns, flyovers)
  useEffect(() => {
    let isCancelled = false;

    if (rawWaypoints.length >= 2) {
      setIsLoadingRoads(true);
      fetchRealRoadRoute(rawWaypoints).then((points) => {
        if (!isCancelled) {
          setRoadPoints(points);
          setIsLoadingRoads(false);
        }
      });
    } else {
      setRoadPoints([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [rawWaypoints]);

  // Precompute cumulative distances along the asphalt road
  const { cumulativeDists, totalDistance } = useMemo(() => {
    if (roadPoints.length < 2) return { cumulativeDists: [], totalDistance: 0 };
    const dists = [0];
    let total = 0;
    for (let i = 1; i < roadPoints.length; i++) {
      const p1 = roadPoints[i - 1];
      const p2 = roadPoints[i];
      const dLat = (p2.lat - p1.lat) * 111320;
      const avgLat = ((p1.lat + p2.lat) / 2) * (Math.PI / 180);
      const dLng = (p2.lng - p1.lng) * 111320 * Math.cos(avgLat);
      const d = Math.sqrt(dLat * dLat + dLng * dLng);
      total += d;
      dists.push(total);
    }
    return { cumulativeDists: dists, totalDistance: total };
  }, [roadPoints]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const bekasiBounds = L.latLngBounds(
        [-6.40, 106.92], // South-West (Bantargebang / Setu)
        [-6.15, 107.12]  // North-East (Babelan / Tambun)
      );

      const map = L.map(mapContainerRef.current, {
        center: [-6.2650, 107.0120],
        zoom: 13.5,
        minZoom: 12,
        maxZoom: 18,
        maxBounds: bekasiBounds,
        maxBoundsViscosity: 0.8,
        zoomControl: false,
        attributionControl: false,
      });

      // OpenStreetMap Tiles with Custom Dark Theme filter
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
        className: "map-tiles-dark",
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.control
        .attribution({ position: "bottomleft", prefix: false })
        .addAttribution("© OpenStreetMap")
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline & Markers when real road points are ready
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || roadPoints.length < 2 || rawWaypoints.length < 2) return;

    progressDistRef.current = 0;
    isRestartingRef.current = false;
    lastTimeRef.current = 0;
    setCurrentProgressPct(0);
    setIsPlaying(true);
    setStatusText(
      activeRouteMode === "grand-tour"
        ? "Gowes menyusuri jalanan dari Alfamidi..."
        : `Gowes ke ${getShortPlaceName(activeEvent?.name || "")}`
    );

    markersGroup.clearLayers();

    const startPt = rawWaypoints[0];

    // 1. Full Real Road Polyline (Follows actual roads on the map)
    const latLngs = roadPoints.map((p) => [p.lat, p.lng] as [number, number]);
    const routePolyline = L.polyline(latLngs, {
      color: "#C44341",
      weight: 4,
      opacity: 0.7,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(markersGroup);
    routePolylineRef.current = routePolyline;

    // 2. Active Neon Red Trail Polyline behind cyclist
    const activeTrailPolyline = L.polyline([[startPt.lat, startPt.lng]], {
      color: "#FF3333",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(markersGroup);
    activeTrailPolylineRef.current = activeTrailPolyline;

    // 3. Start Marker (Alfamidi Depan Tol Bekasi Timur)
    const startIcon = L.divIcon({
      className: "custom-map-pin start-pin",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
          <div style="background:rgba(16,185,129,0.95);color:white;border:1.5px solid white;padding:2px 6px;border-radius:10px;font-size:9px;font-weight:bold;font-family:monospace;white-space:nowrap;box-shadow:0 0 8px rgba(16,185,129,0.8);margin-bottom:1px;">
            🚩 START: Alfamidi Tol
          </div>
          <div style="width:12px;height:12px;background:#10B981;border:2px solid white;border-radius:50%;box-shadow:0 0 6px #10B981;"></div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [60, 34],
    });

    L.marker([startPt.lat, startPt.lng], { icon: startIcon })
      .addTo(markersGroup)
      .bindPopup(`
        <div style="color:#222;font-size:12px;padding:2px;">
          <strong style="color:#059669;font-size:12px;">🚩 Titik Kumpul Utama</strong><br/>
          <b>Alfamidi Depan Tol Bekasi Timur</b><br/>
          <span style="color:#666;font-size:11px;">Jam Kumpul: 05:30 WIB</span>
        </div>
      `);

    // 4. Waypoints / Destination Markers
    if (activeRouteMode === "grand-tour") {
      for (let i = 1; i < rawWaypoints.length; i++) {
        const wp = rawWaypoints[i];
        const isLast = i === rawWaypoints.length - 1;
        const shortName = getShortPlaceName(wp.name || "");
        const wpIcon = L.divIcon({
          className: "custom-map-pin wp-pin",
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="background:${isLast ? "#C44341" : "rgba(20,20,20,0.9)"};color:${isLast ? "white" : "#FBBF24"};border:1px solid ${isLast ? "white" : "#FBBF24"};padding:2px 5px;border-radius:8px;font-size:9px;font-weight:bold;font-family:monospace;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.8);margin-bottom:1px;">
                ${i}. ${shortName}
              </div>
              <div style="width:10px;height:10px;background:${isLast ? "#C44341" : "#FBBF24"};border:1.5px solid white;border-radius:50%;box-shadow:0 0 5px ${isLast ? "#C44341" : "#FBBF24"};"></div>
            </div>
          `,
          iconSize: [110, 34],
          iconAnchor: [55, 32],
        });

        L.marker([wp.lat, wp.lng], { icon: wpIcon })
          .addTo(markersGroup)
          .bindPopup(`
            <div style="color:#222;font-size:12px;padding:2px;">
              <strong style="color:#C44341;">📍 Stop ${i}: ${wp.name}</strong>
            </div>
          `);
      }
    } else {
      const endPt = rawWaypoints[rawWaypoints.length - 1];
      const endIcon = L.divIcon({
        className: "custom-map-pin end-pin",
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
            <div style="background:#C44341;color:white;border:1.5px solid white;padding:2px 6px;border-radius:10px;font-size:9px;font-weight:bold;font-family:monospace;white-space:nowrap;box-shadow:0 0 10px rgba(196,67,65,0.9);margin-bottom:1px;">
              ☕ ${getShortPlaceName(endPt.name || activeEvent?.name || "")}
            </div>
            <div style="width:14px;height:14px;background:#C44341;border:2px solid white;border-radius:50%;box-shadow:0 0 8px #C44341;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          </div>
        `,
        iconSize: [130, 38],
        iconAnchor: [65, 36],
      });

      L.marker([endPt.lat, endPt.lng], { icon: endIcon })
        .addTo(markersGroup)
        .bindPopup(`
          <div style="color:#222;font-size:12px;padding:2px;">
            <strong style="color:#C44341;">☕ Destinasi Akhir</strong><br/>
            <b>${activeEvent?.name}</b><br/>
            <span style="color:#666;font-size:11px;">Jarak: ${activeEvent?.distance || "±25 KM"}</span>
          </div>
        `);
    }

    // 5. Animated Cyclist Sprite Marker (public/images/cyclist.png)
    const cyclistIcon = L.divIcon({
      className: "cyclist-moving-icon",
      html: `
        <div id="cyclist-avatar-wrapper" style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;bottom:3px;width:28px;height:10px;background:rgba(196,67,65,0.6);border-radius:50%;filter:blur(2.5px);box-shadow:0 0 10px #FF3333;"></div>
          <img
            id="cyclist-sprite-img"
            src="/images/cyclist.png"
            alt="Cyclist"
            style="width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.9));transform:scaleX(1);"
          />
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 32],
    });

    const cyclistMarker = L.marker([startPt.lat, startPt.lng], {
      icon: cyclistIcon,
      zIndexOffset: 1000,
    }).addTo(markersGroup);
    cyclistMarkerRef.current = cyclistMarker;

    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, {
      padding: [20, 20],
      maxZoom: activeRouteMode === "grand-tour" ? 14.5 : 15.5,
    });
  }, [activeRouteMode, activeEvent, roadPoints, rawWaypoints]);

  // Reset animation position when route mode changes
  useEffect(() => {
    progressDistRef.current = 0;
    isRestartingRef.current = false;
    lastTimeRef.current = 0;
    setCurrentProgressPct(0);
  }, [activeRouteMode]);

  // Main Continuous Road-Following Animation Loop (Butter-Smooth 60fps/120fps with Zero Stutter)
  useEffect(() => {
    if (!isPlaying || roadPoints.length < 2 || totalDistance <= 0) return;

    lastTimeRef.current = 0;

    const animate = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Base duration at 1x speed:
      // Grand Tour (~60-80km): 40s (1x) | 20s (2x) | 10s (4x)
      // Single Event (~15-25km): 18s (1x) | 9s (2x) | 4.5s (4x)
      const baseDuration = activeRouteMode === "grand-tour" ? 40 : 18;
      const speedMetersPerSec = (totalDistance / baseDuration) * speedMultiplier;

      if (!isRestartingRef.current) {
        progressDistRef.current += speedMetersPerSec * dt;

        if (progressDistRef.current >= totalDistance) {
          progressDistRef.current = totalDistance;
          isRestartingRef.current = true;

          const pos = getPositionAtDistance(
            totalDistance,
            roadPoints,
            cumulativeDists,
            totalDistance
          );
          if (cyclistMarkerRef.current) {
            cyclistMarkerRef.current.setLatLng([pos.lat, pos.lng]);
          }
          if (activeTrailPolylineRef.current) {
            const allCoords = roadPoints.map((p) => [p.lat, p.lng] as [number, number]);
            activeTrailPolylineRef.current.setLatLngs(allCoords);
          }

          setCurrentProgressPct(100);
          setStatusText(
            activeRouteMode === "grand-tour"
              ? "Selesai Jelajah Rute Gowes! ☕"
              : `Sampai di ${getShortPlaceName(activeEvent?.name || "")}! ☕`
          );

          // Auto restart after 3.5s
          setTimeout(() => {
            progressDistRef.current = 0;
            isRestartingRef.current = false;
            lastTimeRef.current = 0;
            setCurrentProgressPct(0);
            if (activeTrailPolylineRef.current && roadPoints.length > 0) {
              activeTrailPolylineRef.current.setLatLngs([[roadPoints[0].lat, roadPoints[0].lng]]);
            }
          }, 3500);

          animFrameRef.current = requestAnimationFrame(animate);
          return;
        }

        // Exact sub-millimeter road coordinate via linear interpolation
        const pos = getPositionAtDistance(
          progressDistRef.current,
          roadPoints,
          cumulativeDists,
          totalDistance
        );

        // 1. Update Cyclist Marker Position
        if (cyclistMarkerRef.current) {
          cyclistMarkerRef.current.setLatLng([pos.lat, pos.lng]);

          // Update Sprite orientation directly in DOM
          const spriteImg = document.getElementById("cyclist-sprite-img");
          if (spriteImg) {
            spriteImg.style.transform = pos.movingWest ? "scaleX(-1)" : "scaleX(1)";
          }
        }

        // 2. Update Active Neon Red Trail smoothly following asphalt road
        if (activeTrailPolylineRef.current) {
          const activePath: [number, number][] = [];
          for (let j = 0; j <= pos.segIndex; j++) {
            activePath.push([roadPoints[j].lat, roadPoints[j].lng]);
          }
          activePath.push([pos.lat, pos.lng]);
          activeTrailPolylineRef.current.setLatLngs(activePath);
        }

        // 3. Smooth camera follow without animation lockups
        if (followCyclist && mapInstanceRef.current) {
          mapInstanceRef.current.setView([pos.lat, pos.lng], mapInstanceRef.current.getZoom(), {
            animate: false,
          });
        }

        // 4. Throttled UI State updates (12fps to prevent React render spikes & GC pauses)
        if (time - lastUiUpdateRef.current > 80) {
          lastUiUpdateRef.current = time;
          const pct = Math.min(99, Math.round((progressDistRef.current / totalDistance) * 100));
          setCurrentProgressPct(pct);

          let currentPlace = "";
          for (let j = pos.segIndex; j >= 0; j--) {
            if (roadPoints[j].name) {
              currentPlace = roadPoints[j].name!;
              break;
            }
          }
          if (currentPlace) {
            setStatusText(`Gowes di: ${getShortPlaceName(currentPlace)}`);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isPlaying,
    roadPoints,
    cumulativeDists,
    totalDistance,
    speedMultiplier,
    followCyclist,
    activeRouteMode,
    activeEvent,
  ]);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) lastTimeRef.current = 0;
      return next;
    });
  };

  const handleReplay = () => {
    progressDistRef.current = 0;
    isRestartingRef.current = false;
    lastTimeRef.current = 0;
    setCurrentProgressPct(0);
    setIsPlaying(true);
    if (cyclistMarkerRef.current && roadPoints.length > 0) {
      const first = roadPoints[0];
      cyclistMarkerRef.current.setLatLng([first.lat, first.lng]);
    }
    if (activeTrailPolylineRef.current && roadPoints.length > 0) {
      const first = roadPoints[0];
      activeTrailPolylineRef.current.setLatLngs([[first.lat, first.lng]]);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && roadPoints.length >= 2) {
      const latLngs = roadPoints.map((p) => [p.lat, p.lng] as [number, number]);
      mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), {
        padding: [20, 20],
        maxZoom: activeRouteMode === "grand-tour" ? 14.5 : 15.5,
      });
    }
  };

  const isUpcoming = activeEvent ? getDaysDifference(activeEvent.date) >= 0 : false;
  const formattedDate = activeEvent ? formatIndonesianFullDate(activeEvent.date) : "";

  const grandTourPills = [
    "🚩 Alfamidi Tol",
    "Situ Cibeureum",
    "Kopi Tuku",
    "Kopitagram",
    "Kopi Kalean",
    "Susy Garden",
    "Kopi Nako",
    "Warkop Beels",
    "CFD Summarecon",
    "ICM Patriot",
    "Situ Cibeureum Lagi ☕",
  ];

  return (
    <div className="w-full bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header & Route Selection Tabs */}
      <div className="p-3 sm:p-5 border-b border-white/15 bg-black/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C44341] animate-ping" />
            <h3
              className="text-sm sm:text-lg font-black uppercase text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Peta Gowes Tiba-Tiba Cycling
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            {isLoadingRoads ? "Menghitung Rute Jalan..." : `${events.length} Destinasi`}
          </span>
        </div>

        {/* Scrollable Route Mode Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {/* Grand Tour Mode Pill */}
          <button
            onClick={() => setActiveRouteMode("grand-tour")}
            className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-all border ${activeRouteMode === "grand-tour"
              ? "bg-[#C44341] text-white border-[#C44341] shadow-md shadow-[#C44341]/40"
              : "bg-black/60 text-gray-300 border-white/15 hover:border-white/30 hover:text-white"
              }`}
          >
            🔥 Jelajah Semua Rute
          </button>

          {/* Clean Short Event Pills */}
          {events.map((ev) => {
            const isSelected = ev.id === activeRouteMode;
            const shortName = getShortPlaceName(ev.name);
            return (
              <button
                key={ev.id}
                onClick={() => {
                  setActiveRouteMode(ev.id);
                  if (onSelectEvent) onSelectEvent(ev);
                }}
                className={`cursor-pointer shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-bold transition-all border ${isSelected
                  ? "bg-[#C44341] text-white border-[#C44341] shadow-md shadow-[#C44341]/40"
                  : "bg-black/60 text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
              >
                🚴 {shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[520px] bg-neutral-950 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Top Left: Compact Cyclist Live Status Overlay */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-[400] max-w-[210px] sm:max-w-[260px] bg-black/90 backdrop-blur-md border border-white/20 rounded-xl p-2 sm:p-3 shadow-2xl space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0">
                <Image
                  src="/images/cyclist.png"
                  alt="Cyclist"
                  fill
                  className="object-contain"
                  sizes="24px"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-white truncate block">
                {statusText}
              </span>
            </div>
            <span className="text-[10px] font-mono font-black text-[#C44341] bg-[#C44341]/10 px-1.5 py-0.5 rounded border border-[#C44341]/30 shrink-0">
              {currentProgressPct}%
            </span>
          </div>

          {/* Compact Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C44341] to-[#FF5555] transition-all duration-100 ease-out"
              style={{ width: `${currentProgressPct}%` }}
            />
          </div>
        </div>

        {/* Floating Bottom: Sleek Control Dock (Mobile Optimized Single Row) */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 z-[400] flex items-center gap-1.5 bg-black/90 backdrop-blur-md border border-white/20 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-2xl">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className={`cursor-pointer px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all shadow-md ${isPlaying
              ? "bg-amber-500 hover:bg-amber-600 text-black"
              : "bg-[#C44341] hover:bg-[#A93434] text-white"
              }`}
          >
            <span>{isPlaying ? "⏸️" : "▶️"}</span>
            <span className="hidden sm:inline">{isPlaying ? "Jeda" : "Gowes"}</span>
          </button>

          {/* Replay Button */}
          <button
            onClick={handleReplay}
            className="cursor-pointer px-2 sm:px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition-colors border border-white/10"
            title="Ulangi Gowes"
          >
            🔄
          </button>

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="cursor-pointer px-2 sm:px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors border border-white/10"
            title="Pusatkan Peta"
          >
            🎯
          </button>

          {/* Speed Selector (1x, 2x, 4x) */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10 text-[11px] font-mono">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`cursor-pointer px-1.5 py-1 rounded font-bold transition-all ${speedMultiplier === s
                  ? "bg-[#C44341] text-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Follow Camera Toggle */}
          <button
            onClick={() => setFollowCyclist((prev) => !prev)}
            className={`cursor-pointer px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${followCyclist
              ? "bg-emerald-900/90 text-emerald-300 border-emerald-500/60"
              : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
              }`}
            title="Kamera Ikuti Pesepeda"
          >
            🎥
          </button>
        </div>
      </div>

      {/* Bottom Info Section Card */}
      {activeEvent ? (
        <div className="p-4 sm:p-5 bg-black/85 border-t border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isUpcoming
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                  : "bg-neutral-800 text-gray-400"
                  }`}
              >
                {isUpcoming ? "Akan Datang" : "Selesai"}
              </span>
              <span className="text-[#C44341] font-bold">📅 {formattedDate}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">⏰ {activeEvent.time || "05:30 WIB"}</span>
              {activeEvent.distance && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">📏 {activeEvent.distance}</span>
                </>
              )}
            </div>

            <h4
              className="text-base sm:text-xl font-black uppercase text-white tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {activeEvent.name}
            </h4>

            <p className="text-xs text-gray-400">
              📍 Titik Kumpul: <span className="text-gray-200">{activeEvent.startLocation}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            {activeEvent.instastoryImage && onOpenStory && (
              <button
                type="button"
                onClick={() => onOpenStory(activeEvent.instastoryImage!, activeEvent.name)}
                className="cursor-pointer flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase font-mono transition-colors border border-white/15 text-center"
              >
                📜 Poster
              </button>
            )}

            {activeEvent.photos && activeEvent.photos.length > 0 && onOpenPhoto && (
              <button
                type="button"
                onClick={() => onOpenPhoto(activeEvent.photos, activeEvent.name)}
                className="cursor-pointer flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase font-mono transition-colors border border-white/15 text-center"
              >
                📷 {activeEvent.photos.length} Foto
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 bg-black/85 border-t border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className="text-sm sm:text-base font-black uppercase text-white tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Rute Menyusuri Jalan Asli Bekasi
              </h4>
            </div>

            {/* Breadcrumb Steps with Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 text-[10px] font-mono">
              {grandTourPills.map((pill, idx) => (
                <React.Fragment key={idx}>
                  <span className="shrink-0 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                    {pill}
                  </span>
                  {idx < grandTourPills.length - 1 && (
                    <span className="text-[#C44341] shrink-0 font-bold">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
