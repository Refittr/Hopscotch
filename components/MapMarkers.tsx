"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { POI } from "@/types/poi";

interface Props {
  pois: POI[];
  visibleIds: Set<string>;
  highlightedId: string | null;
  onMarkerClick: (placeId: string) => void;
}

function makeIcon(highlighted: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: highlighted ? 9 : 6,
    fillColor: "#E8A44A",
    fillOpacity: highlighted ? 1 : 0.75,
    strokeColor: highlighted ? "#ffffff" : "rgba(232,164,74,0.35)",
    strokeWeight: highlighted ? 2.5 : 1.5,
  };
}

export default function MapMarkers({ pois, visibleIds, highlightedId, onMarkerClick }: Props) {
  const map = useMap();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const onClickRef = useRef(onMarkerClick);

  useEffect(() => { onClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // Create or remove markers as pois list changes
  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(pois.map((p) => p.placeId));

    // Remove stale markers
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        google.maps.event.clearListeners(marker, "click");
        markersRef.current.delete(id);
      }
    }

    // Add new markers
    for (const poi of pois) {
      if (!markersRef.current.has(poi.placeId)) {
        const marker = new google.maps.Marker({
          position: { lat: poi.lat, lng: poi.lng },
          map,
          icon: makeIcon(poi.placeId === highlightedId),
          optimized: true,
        });
        marker.addListener("click", () => onClickRef.current(poi.placeId));
        markersRef.current.set(poi.placeId, marker);
      }
    }
  }, [map, pois]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show / hide based on filter
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setVisible(visibleIds.has(id));
    }
  }, [visibleIds]);

  // Update icon for highlighted marker
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(makeIcon(id === highlightedId));
      if (id === highlightedId) marker.setZIndex(999);
      else marker.setZIndex(undefined);
    }
  }, [highlightedId]);

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
