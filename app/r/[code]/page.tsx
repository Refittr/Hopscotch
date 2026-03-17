"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

interface Stop {
  name: string;
  lat: number;
  lng: number;
  order: number;
  walkMinutes?: number;
  distanceKm?: number;
}

interface SharedRoute {
  city_name: string;
  stops: Stop[];
  created_at: string;
}

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1714" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1714" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6560" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d4c9bb" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e1c18" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2e2b27" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8077" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#38342e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0c0a" }] },
];

function svgIcon(svg: string, size: number): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

function stopIcon(n: number, isLast: boolean): google.maps.Icon {
  const color = isLast ? "#FF2D78" : "#00F0FF";
  return svgIcon(
    `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="rgba(0,0,0,0.3)"/>
      <circle cx="16" cy="16" r="12" fill="${color}" opacity="0.9"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="Arial">${n}</text>
    </svg>`,
    32
  );
}

function RouteLayer({ stops }: { stops: Stop[] }) {
  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || stops.length === 0) return;

    // Place markers
    stops.forEach((stop, i) => {
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        icon: stopIcon(i + 1, i === stops.length - 1),
        zIndex: 5,
        optimized: false,
      });
      markersRef.current.push(marker);
    });

    // Draw lines
    for (let i = 0; i < stops.length - 1; i++) {
      const pl = new google.maps.Polyline({
        path: [
          { lat: stops[i].lat, lng: stops[i].lng },
          { lat: stops[i + 1].lat, lng: stops[i + 1].lng },
        ],
        strokeColor: "#00F0FF",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
        geodesic: true,
      });
      polylinesRef.current.push(pl);
    }

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, { top: 60, right: 40, bottom: 60, left: 360 });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      polylinesRef.current.forEach((p) => p.setMap(null));
      markersRef.current = [];
      polylinesRef.current = [];
    };
  }, [map, stops]);

  return null;
}

export default function SharedRoutePage() {
  const { code } = useParams<{ code: string }>();
  const [route, setRoute] = useState<SharedRoute | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(true);
        else setRoute(data);
      })
      .catch(() => setError(true));
  }, [code]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0f0d0b" }}>
        <p style={{ color: "#6b6560", fontFamily: "sans-serif" }}>Route not found.</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0f0d0b" }}>
        <p style={{ color: "#6b6560", fontFamily: "sans-serif" }}>Loading route…</p>
      </div>
    );
  }

  const totalWalk = route.stops.reduce((s, stop) => s + (stop.walkMinutes ?? 0), 0);
  const googleMapsUrl =
    "https://www.google.com/maps/dir/" +
    route.stops.map((s) => `${s.lat},${s.lng}`).join("/") +
    "/?travelmode=walking";

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex h-screen overflow-hidden" style={{ background: "#0f0d0b" }}>
        {/* Sidebar */}
        <aside
          className="flex flex-col h-full flex-shrink-0 overflow-y-auto"
          style={{
            width: "320px",
            minWidth: "320px",
            background: "#1a1714",
            borderRight: "1px solid #2e2b27",
          }}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid #2e2b27" }}>
            <p style={{ fontFamily: "var(--font-display, cursive)", fontSize: "22px", color: "#00F0FF" }}>
              Hopspot
            </p>
            <p className="mt-1 text-xs" style={{ color: "#6b6560", letterSpacing: "0.2em" }}>
              SHARED ROUTE
            </p>
          </div>

          {/* City + stats */}
          <div className="px-5 pt-4 pb-4" style={{ borderBottom: "1px solid #2e2b27" }}>
            <p className="text-lg font-semibold" style={{ color: "#e8e0d5", fontFamily: "sans-serif" }}>
              {route.city_name}
            </p>
            <p className="text-sm mt-1" style={{ color: "#6b6560", fontFamily: "sans-serif" }}>
              {route.stops.length} stops
              {totalWalk > 0 && ` · ~${totalWalk} min walking`}
            </p>
          </div>

          {/* Stop list */}
          <div className="flex flex-col px-5 py-4 gap-0">
            {route.stops.map((stop, i) => (
              <div key={i} className="flex gap-3">
                {/* Line + dot */}
                <div className="flex flex-col items-center" style={{ width: "20px" }}>
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      width: "20px",
                      height: "20px",
                      background: i === route.stops.length - 1 ? "#FF2D78" : "#00F0FF",
                      color: "#0a0a0a",
                      fontSize: "10px",
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < route.stops.length - 1 && (
                    <div style={{ width: "2px", flex: 1, minHeight: "32px", background: "#2e2b27" }} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#e8e0d5", fontFamily: "sans-serif" }}>
                    {stop.name}
                  </p>
                  {stop.walkMinutes != null && i < route.stops.length - 1 && (
                    <p className="text-xs mt-0.5" style={{ color: "#6b6560", fontFamily: "sans-serif" }}>
                      ↓ {stop.walkMinutes} min walk
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Open in Google Maps */}
          <div className="px-5 pb-6 mt-auto">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold"
              style={{
                background: "#00F0FF",
                color: "#0a0a0a",
                textDecoration: "none",
                fontFamily: "sans-serif",
              }}
            >
              Open in Google Maps
            </a>
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            key="shared"
            defaultCenter={{ lat: route.stops[0].lat, lng: route.stops[0].lng }}
            defaultZoom={13}
            disableDefaultUI
            gestureHandling="greedy"
            styles={DARK_MAP_STYLES}
            style={{ width: "100%", height: "100%" }}
          >
            <RouteLayer stops={route.stops} />
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}
