"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { POI } from "@/types/poi";

interface Props {
  pois: POI[];
  visibleIds: Set<string>;
  shortlistIds: Set<string>;
  highlightedId: string | null;
  onMarkerClick: (placeId: string) => void;
  hideAll?: boolean;
}

function browseIcon(highlighted: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: highlighted ? 9 : 6,
    fillColor: "#00F0FF",
    fillOpacity: highlighted ? 0.95 : 0.6,
    strokeColor: highlighted ? "#ffffff" : "rgba(0,240,255,0.3)",
    strokeWeight: highlighted ? 2.5 : 1.5,
  };
}

function shortlistIcon(highlighted: boolean): google.maps.Icon {
  const size = highlighted ? 26 : 22;
  const r = highlighted ? 9 : 7;
  const cx = size / 2;
  const glowR = r + 5;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cx}" r="${glowR}" fill="rgba(255,45,120,0.15)"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="#00F0FF"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="#FF2D78" stroke-width="2.5"/>
  </svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return {
    url,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(cx, cx),
  };
}

export default function MapMarkers({
  pois,
  visibleIds,
  shortlistIds,
  highlightedId,
  onMarkerClick,
  hideAll = false,
}: Props) {
  const map = useMap();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const onClickRef = useRef(onMarkerClick);

  useEffect(() => { onClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // Create / remove markers when pois list changes
  useEffect(() => {
    if (!map) return;
    const currentIds = new Set(pois.map((p) => p.placeId));

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        google.maps.event.clearListeners(marker, "click");
        markersRef.current.delete(id);
      }
    }

    for (const poi of pois) {
      if (!markersRef.current.has(poi.placeId)) {
        const isShortlisted = shortlistIds.has(poi.placeId);
        const isHighlighted = poi.placeId === highlightedId;
        const marker = new google.maps.Marker({
          position: { lat: poi.lat, lng: poi.lng },
          map,
          icon: isShortlisted ? shortlistIcon(isHighlighted) : browseIcon(isHighlighted),
          optimized: !isShortlisted, // SVG icons can't be optimized
          zIndex: isShortlisted ? 10 : undefined,
        });
        marker.addListener("click", () => onClickRef.current(poi.placeId));
        markersRef.current.set(poi.placeId, marker);
      }
    }
  }, [map, pois]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show / hide based on filter or route mode
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setVisible(!hideAll && visibleIds.has(id));
    }
  }, [visibleIds, hideAll]);

  // Update icons when shortlist or highlight changes
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const isShortlisted = shortlistIds.has(id);
      const isHighlighted = id === highlightedId;
      marker.setIcon(
        isShortlisted ? shortlistIcon(isHighlighted) : browseIcon(isHighlighted)
      );
      marker.setZIndex(isShortlisted ? 10 : isHighlighted ? 5 : undefined);
      // SVG icon markers can't be batched (optimized: false needed)
      marker.setOptions({ optimized: !isShortlisted });
    }
  }, [shortlistIds, highlightedId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current.values()) {
        marker.setMap(null);
        google.maps.event.clearListeners(marker, "click");
      }
      markersRef.current.clear();
    };
  }, []);

  return null;
}
