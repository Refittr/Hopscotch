"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Cluster } from "@googlemaps/markerclusterer";
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
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(cx, cx),
  };
}

const clusterRenderer = {
  render({ count, position }: Cluster): google.maps.Marker {
    const size = count <= 10 ? 36 : count <= 25 ? 44 : 52;
    const fontSize = count <= 10 ? 11 : count <= 25 ? 12 : 13;
    const c = size / 2;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${c}" cy="${c}" r="${c - 1}" fill="#00F0FF" opacity="0.08"/>
      <circle cx="${c}" cy="${c}" r="${c - 4}" fill="#1a1816" stroke="#00F0FF" stroke-width="1.5"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#00F0FF" font-size="${fontSize}" font-family="sans-serif" font-weight="700">${count}</text>
    </svg>`;
    return new google.maps.Marker({
      position,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(c, c),
      },
      zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
    });
  },
};

export default function MapMarkers({
  pois,
  visibleIds,
  shortlistIds,
  highlightedId,
  onMarkerClick,
  hideAll = false,
}: Props) {
  const map = useMap();
  const browseMarkersRef    = useRef<Map<string, google.maps.Marker>>(new Map());
  const shortlistMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef        = useRef<MarkerClusterer | null>(null);
  const highlightOverlayRef = useRef<google.maps.Marker | null>(null);
  const onClickRef          = useRef(onMarkerClick);

  useEffect(() => { onClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // Initialise clusterer once map is ready
  useEffect(() => {
    if (!map) return;
    const c = new MarkerClusterer({ map, markers: [], renderer: clusterRenderer });
    clustererRef.current = c;
    return () => {
      c.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Create / remove markers whenever the visible set changes
  useEffect(() => {
    if (!map || !clustererRef.current) return;

    // Wipe everything
    clustererRef.current.clearMarkers(true);
    for (const m of browseMarkersRef.current.values()) {
      m.setMap(null); // also cleans up any extracted (highlighted) markers
      google.maps.event.clearListeners(m, "click");
    }
    browseMarkersRef.current.clear();

    for (const m of shortlistMarkersRef.current.values()) {
      m.setMap(null);
      google.maps.event.clearListeners(m, "click");
    }
    shortlistMarkersRef.current.clear();

    if (hideAll) {
      clustererRef.current.render();
      return;
    }

    const poiMap = new Map(pois.map((p) => [p.placeId, p]));
    const newBrowseMarkers: google.maps.Marker[] = [];
    let count = 0;

    for (const id of visibleIds) {
      if (count >= 120) break;
      const poi = poiMap.get(id);
      if (!poi || shortlistIds.has(id)) continue;
      const m = new google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map: null, // clusterer manages placement
        icon: browseIcon(false),
        optimized: true,
      });
      m.addListener("click", () => onClickRef.current(id));
      browseMarkersRef.current.set(id, m);
      newBrowseMarkers.push(m);
      count++;
    }

    // Shortlisted markers — always unclustered
    for (const id of shortlistIds) {
      const poi = poiMap.get(id);
      if (!poi) continue;
      const m = new google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        map,
        icon: shortlistIcon(false),
        optimized: false,
        zIndex: 10,
      });
      m.addListener("click", () => onClickRef.current(id));
      shortlistMarkersRef.current.set(id, m);
    }

    clustererRef.current.addMarkers(newBrowseMarkers, true);
    clustererRef.current.render();
  }, [map, pois, visibleIds, hideAll, shortlistIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update highlight — use a separate overlay marker so clusterer is never touched
  useEffect(() => {
    if (!map) return;

    // Shortlist markers: update icon directly (they're always on the map)
    for (const [id, m] of shortlistMarkersRef.current) {
      const h = id === highlightedId;
      m.setIcon(shortlistIcon(h));
      m.setZIndex(h ? 15 : 10);
    }

    // Browse markers stay in the clusterer untouched — just keep icons plain
    for (const m of browseMarkersRef.current.values()) {
      m.setIcon(browseIcon(false));
      m.setOptions({ optimized: true });
    }

    if (!highlightedId) {
      highlightOverlayRef.current?.setMap(null);
      return;
    }

    // Find position from browse or shortlist marker
    const pos =
      browseMarkersRef.current.get(highlightedId)?.getPosition() ??
      shortlistMarkersRef.current.get(highlightedId)?.getPosition() ??
      null;

    if (!pos) {
      highlightOverlayRef.current?.setMap(null);
      return;
    }

    // Create overlay once, reuse afterwards
    if (!highlightOverlayRef.current) {
      highlightOverlayRef.current = new google.maps.Marker({
        optimized: false,
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + 100,
      });
    }
    highlightOverlayRef.current.setPosition(pos);
    highlightOverlayRef.current.setIcon(browseIcon(true));
    highlightOverlayRef.current.setMap(map);
  }, [highlightedId, map, shortlistIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clustererRef.current?.clearMarkers();
      highlightOverlayRef.current?.setMap(null);
      for (const m of [
        ...browseMarkersRef.current.values(),
        ...shortlistMarkersRef.current.values(),
      ]) {
        m.setMap(null);
        google.maps.event.clearListeners(m, "click");
      }
    };
  }, []);

  return null;
}
