"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { RouteState, HopPosition } from "@/types/route";
import type { POI } from "@/types/poi";

interface Props {
  routeState: RouteState | null;
  shortlist: POI[];
  hoveredHopOptionId?: string | null;
  suggestionPreviewPos?: { lat: number; lng: number } | null;
}

// ── SVG marker icon helpers ─────────────────────────────────────────────────

function svgIcon(svg: string, size: number): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}

function visitedIcon(): google.maps.Icon {
  return svgIcon(
    `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="8" fill="#2a2730"/>
      <circle cx="9" cy="9" r="8" fill="none" stroke="#5e5a66" stroke-width="1.5"/>
      <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#5e5a66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    18
  );
}

function currentPosIcon(): google.maps.Icon {
  return svgIcon(
    `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="rgba(0,240,255,0.12)"/>
      <circle cx="16" cy="16" r="9" fill="#00F0FF"/>
      <circle cx="16" cy="16" r="9" fill="none" stroke="white" stroke-width="2.5"/>
    </svg>`,
    32
  );
}

function hopOptionIcon(n: 1 | 2 | 3): google.maps.Icon {
  return svgIcon(
    `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" fill="rgba(255,45,120,0.18)"/>
      <circle cx="14" cy="14" r="10" fill="#FF2D78"/>
      <text x="14" y="19" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="Arial">${n}</text>
    </svg>`,
    28
  );
}

function dimIcon(): google.maps.Icon {
  return svgIcon(
    `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="6" fill="rgba(0,240,255,0.2)" stroke="rgba(0,240,255,0.3)" stroke-width="1"/>
    </svg>`,
    14
  );
}

function startPickIcon(n: number): google.maps.Icon {
  return svgIcon(
    `<svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="17" r="16" fill="rgba(0,240,255,0.1)" stroke="#00F0FF" stroke-width="1.5" stroke-dasharray="4 3"/>
      <circle cx="17" cy="17" r="11" fill="rgba(0,240,255,0.18)"/>
      <text x="17" y="22" text-anchor="middle" fill="#00F0FF" font-size="13" font-weight="bold" font-family="Arial">${n}</text>
    </svg>`,
    34
  );
}

function startPickIconHighlighted(n: number): google.maps.Icon {
  return svgIcon(
    `<svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
      <circle cx="23" cy="23" r="22" fill="rgba(0,240,255,0.18)" stroke="#00F0FF" stroke-width="2"/>
      <circle cx="23" cy="23" r="15" fill="rgba(0,240,255,0.35)"/>
      <text x="23" y="29" text-anchor="middle" fill="#00F0FF" font-size="16" font-weight="bold" font-family="Arial">${n}</text>
    </svg>`,
    46
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RouteMapLayer({ routeState, shortlist, hoveredHopOptionId, suggestionPreviewPos }: Props) {
  const map = useMap();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const drawnHopsRef = useRef(0);
  const directionsRef = useRef<google.maps.DirectionsService | null>(null);
  const previewPolylineRef = useRef<google.maps.Polyline | null>(null);
  const suggestionPolylineRef = useRef<google.maps.Polyline | null>(null);
  const suggestionMarkerRef = useRef<google.maps.Marker | null>(null);

  // Init directions service
  useEffect(() => {
    if (!map || directionsRef.current) return;
    directionsRef.current = new google.maps.DirectionsService();
  }, [map]);

  // Full cleanup when exiting route mode
  useEffect(() => {
    if (routeState !== null) return;
    for (const m of markersRef.current.values()) {
      m.setMap(null);
      google.maps.event.clearListeners(m, "click");
    }
    markersRef.current.clear();
    for (const pl of polylinesRef.current) pl.setMap(null);
    polylinesRef.current = [];
    drawnHopsRef.current = 0;
    previewPolylineRef.current?.setMap(null);
    previewPolylineRef.current = null;
    suggestionPolylineRef.current?.setMap(null);
    suggestionPolylineRef.current = null;
    suggestionMarkerRef.current?.setMap(null);
    suggestionMarkerRef.current = null;
  }, [routeState]);

  // Update markers based on route phase
  useEffect(() => {
    if (!map || !routeState) return;

    const ensureMarker = (
      key: string,
      position: { lat: number; lng: number },
      icon: google.maps.Icon,
      zIndex = 1
    ) => {
      let m = markersRef.current.get(key);
      if (!m) {
        m = new google.maps.Marker({ position, map, icon, optimized: false, zIndex });
        markersRef.current.set(key, m);
      } else {
        m.setPosition(position);
        m.setIcon(icon);
        m.setZIndex(zIndex);
        m.setVisible(true);
      }
    };

    const hideMarker = (key: string) => markersRef.current.get(key)?.setVisible(false);

    const shortlistIds = new Set(shortlist.map((p) => p.placeId));

    if (routeState.phase === "picking_start") {
      // Hide anything that isn't a shortlist spot
      for (const [key] of markersRef.current) {
        if (!shortlistIds.has(key)) hideMarker(key);
      }
      // Show all shortlist spots as numbered dashed "pickable" markers
      shortlist.forEach((p, i) => {
        const isHighlighted = p.placeId === hoveredHopOptionId;
        ensureMarker(
          p.placeId,
          { lat: p.lat, lng: p.lng },
          isHighlighted ? startPickIconHighlighted(i + 1) : startPickIcon(i + 1),
          isHighlighted ? 10 : 5
        );
      });
      // Fit map to show all of them
      if (shortlist.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        shortlist.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        const narrow = map.getDiv().clientWidth < 600;
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: narrow ? 20 : 460 });
      }
      return;
    }

    if (routeState.phase === "hopping") {
      const { currentPosition, visitedIds, hopOptions, remainingPois } = routeState;
      const hopOptionIds = new Set(hopOptions.map((o) => o.poi.placeId));

      // Hide anything not in shortlist anymore
      for (const [key, m] of markersRef.current) {
        if (!shortlistIds.has(key) && key !== "current_pos") m.setVisible(false);
      }

      // Visited markers
      for (const p of shortlist.filter((p) => visitedIds.has(p.placeId))) {
        ensureMarker(p.placeId, { lat: p.lat, lng: p.lng }, visitedIcon(), 2);
      }

      // Current position
      ensureMarker(
        "current_pos",
        { lat: currentPosition.lat, lng: currentPosition.lng },
        currentPosIcon(),
        10
      );

      // Hop option markers
      hopOptions.forEach((opt) => {
        ensureMarker(
          opt.poi.placeId,
          { lat: opt.poi.lat, lng: opt.poi.lng },
          hopOptionIcon(opt.optionIndex),
          8
        );
      });

      // Dim remaining (not visited, not a hop option)
      for (const p of remainingPois.filter(
        (p) => !hopOptionIds.has(p.placeId) && !visitedIds.has(p.placeId)
      )) {
        ensureMarker(p.placeId, { lat: p.lat, lng: p.lng }, dimIcon(), 1);
      }

      // Camera: fit around current position + hop options
      if (hopOptions.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: currentPosition.lat, lng: currentPosition.lng });
        hopOptions.forEach((o) =>
          bounds.extend({ lat: o.poi.lat, lng: o.poi.lng })
        );
        const narrow = map.getDiv().clientWidth < 600;
        map.fitBounds(bounds, { top: 60, right: 40, bottom: 60, left: narrow ? 20 : 440 });
      }
    }

    if (routeState.phase === "complete") {
      markersRef.current.get("current_pos")?.setVisible(false);
      for (const p of shortlist) {
        ensureMarker(p.placeId, { lat: p.lat, lng: p.lng }, visitedIcon(), 2);
      }
    }
  }, [map, routeState, shortlist, hoveredHopOptionId]);

  // Draw polylines for new completed hops (also handles undo by removing excess)
  useEffect(() => {
    if (!map || !routeState || routeState.phase === "picking_start") return;

    const hops = routeState.completedHops;

    // Undo: remove polylines for hops that no longer exist
    if (hops.length < drawnHopsRef.current) {
      while (polylinesRef.current.length > hops.length) {
        const pl = polylinesRef.current.pop()!;
        pl.setMap(null);
      }
      drawnHopsRef.current = hops.length;
      return;
    }

    if (hops.length <= drawnHopsRef.current) return;

    const newHops = hops.slice(drawnHopsRef.current);

    for (const hop of newHops) {
      const from = { lat: hop.from.lat, lng: hop.from.lng };
      const to = { lat: hop.to.lat, lng: hop.to.lng };

      const drawPolyline = (path: google.maps.LatLngLiteral[]) => {
        const pl = new google.maps.Polyline({
          path,
          strokeColor: "#00F0FF",
          strokeOpacity: 0.85,
          strokeWeight: 3,
          map,
          zIndex: 5,
          geodesic: true,
        });
        polylinesRef.current.push(pl);
      };

      if (directionsRef.current) {
        directionsRef.current.route(
          {
            origin: from,
            destination: to,
            travelMode: google.maps.TravelMode.WALKING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              drawPolyline(
                result.routes[0].overview_path.map((p) => ({
                  lat: p.lat(),
                  lng: p.lng(),
                }))
              );
            } else {
              drawPolyline([from, to]); // straight-line fallback
            }
          }
        );
      } else {
        drawPolyline([from, to]);
      }
    }

    drawnHopsRef.current = hops.length;
  }, [
    map,
    routeState?.phase === "hopping" || routeState?.phase === "complete"
      ? routeState.completedHops.length
      : 0,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preview polyline on hop option hover
  useEffect(() => {
    previewPolylineRef.current?.setMap(null);
    previewPolylineRef.current = null;

    if (!map || !hoveredHopOptionId || !routeState || routeState.phase !== "hopping") return;

    const opt = routeState.hopOptions.find((o) => o.poi.placeId === hoveredHopOptionId);
    if (!opt) return;

    const from = { lat: routeState.currentPosition.lat, lng: routeState.currentPosition.lng };
    const to = { lat: opt.poi.lat, lng: opt.poi.lng };

    previewPolylineRef.current = new google.maps.Polyline({
      path: [from, to],
      strokeColor: "#FF2D78",
      strokeOpacity: 0,
      strokeWeight: 2,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 0.85,
            strokeColor: "#FF2D78",
            scale: 3,
          },
          offset: "0",
          repeat: "14px",
        },
      ],
      map,
      zIndex: 6,
    });
  }, [map, hoveredHopOptionId, routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Suggestion preview polyline + marker
  useEffect(() => {
    suggestionPolylineRef.current?.setMap(null);
    suggestionPolylineRef.current = null;
    suggestionMarkerRef.current?.setMap(null);
    suggestionMarkerRef.current = null;

    if (!map || !suggestionPreviewPos || !routeState || routeState.phase !== "hopping") return;

    const from = { lat: routeState.currentPosition.lat, lng: routeState.currentPosition.lng };
    const to = suggestionPreviewPos;

    suggestionPolylineRef.current = new google.maps.Polyline({
      path: [from, to],
      strokeColor: "#FF2D78",
      strokeOpacity: 0,
      strokeWeight: 2,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 0.7,
            strokeColor: "#FF2D78",
            scale: 3,
          },
          offset: "0",
          repeat: "14px",
        },
      ],
      map,
      zIndex: 7,
    });

    suggestionMarkerRef.current = new google.maps.Marker({
      position: to,
      map,
      icon: svgIcon(
        `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="13" fill="rgba(255,45,120,0.2)"/>
          <circle cx="14" cy="14" r="9" fill="#FF2D78"/>
          <text x="14" y="19" text-anchor="middle" fill="white" font-size="14" font-family="Arial">✨</text>
        </svg>`,
        28
      ),
      zIndex: 9,
      optimized: false,
    });
  }, [map, suggestionPreviewPos, routeState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const m of markersRef.current.values()) m.setMap(null);
      for (const pl of polylinesRef.current) pl.setMap(null);
      previewPolylineRef.current?.setMap(null);
      suggestionPolylineRef.current?.setMap(null);
      suggestionMarkerRef.current?.setMap(null);
    };
  }, []);

  return null;
}
