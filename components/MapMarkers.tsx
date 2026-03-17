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

function browseIcon(highlighted: boolean): google.maps.Symbol | google.maps.Icon {
  if (highlighted) {
    const size = 64;
    const c = size / 2;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${c}" cy="${c}" r="8" fill="none" stroke="#00F0FF" stroke-width="1.5" opacity="0.9">
        <animate attributeName="r" from="8" to="30" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${c}" cy="${c}" r="8" fill="none" stroke="#00F0FF" stroke-width="1" opacity="0.6">
        <animate attributeName="r" from="8" to="30" dur="1.2s" begin="0.4s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.2s" begin="0.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${c}" cy="${c}" r="9" fill="#00F0FF" opacity="0.25"/>
      <circle cx="${c}" cy="${c}" r="7" fill="#00F0FF" stroke="white" stroke-width="2.5"/>
    </svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(c, c),
    };
  }
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 6,
    fillColor: "#00F0FF",
    fillOpacity: 0.6,
    strokeColor: "rgba(0,240,255,0.3)",
    strokeWeight: 1.5,
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

  // Create / remove markers — only for currently visible POIs (capped at 200)
  useEffect(() => {
    if (!map) return;

    const poiMap = new Map(pois.map((p) => [p.placeId, p]));
    const targetIds: Set<string> = new Set();
    if (!hideAll) {
      let count = 0;
      for (const id of visibleIds) {
        if (count >= 200) break;
        if (poiMap.has(id)) { targetIds.add(id); count++; }
      }
      // Always include shortlisted
      for (const id of shortlistIds) {
        if (poiMap.has(id)) targetIds.add(id);
      }
    }

    // Remove markers no longer needed
    for (const [id, marker] of markersRef.current) {
      if (!targetIds.has(id)) {
        marker.setMap(null);
        google.maps.event.clearListeners(marker, "click");
        markersRef.current.delete(id);
      }
    }

    // Create new markers
    for (const id of targetIds) {
      if (markersRef.current.has(id)) continue;
      const poi = poiMap.get(id)!;
      const isShortlisted = shortlistIds.has(poi.placeId);
      const isHighlighted = poi.placeId === highlightedId;
      const marker = new google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map,
        visible: true,
        icon: isShortlisted ? shortlistIcon(isHighlighted) : browseIcon(isHighlighted),
        optimized: !isShortlisted,
        zIndex: isShortlisted ? 10 : undefined,
      });
      marker.addListener("click", () => onClickRef.current(poi.placeId));
      markersRef.current.set(poi.placeId, marker);
    }
  }, [map, pois, visibleIds, hideAll, shortlistIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update icons when shortlist or highlight changes
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const isShortlisted = shortlistIds.has(id);
      const isHighlighted = id === highlightedId;
      marker.setIcon(
        isShortlisted ? shortlistIcon(isHighlighted) : browseIcon(isHighlighted)
      );
      marker.setZIndex(isShortlisted ? 10 : isHighlighted ? 5 : undefined);
      marker.setOptions({ optimized: !isShortlisted && !isHighlighted });
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
