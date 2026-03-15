"use client";

import { useEffect, useRef } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import type { SelectedCity } from "@/app/page";
import type { POI } from "@/types/poi";
import POIFetcher from "./POIFetcher";
import MapMarkers from "./MapMarkers";
import RouteMapLayer from "./RouteMapLayer";
import type { RouteState } from "@/types/route";

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1714" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1714" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6560" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d4c9bb" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a7f74" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1e1c18" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2e2b27" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1714" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8077" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#38342e" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c9a96e" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2a2824" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c9a96e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d0c0a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3a3730" }],
  },
];

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;
const CITY_ZOOM = 13;

function MapController({ selectedCity }: { selectedCity: SelectedCity | null }) {
  const map = useMap();
  const prevCityRef = useRef<SelectedCity | null>(null);

  useEffect(() => {
    if (!map) return;

    if (selectedCity) {
      map.panTo({ lat: selectedCity.lat, lng: selectedCity.lng });
      const currentZoom = map.getZoom() ?? DEFAULT_ZOOM;
      if (currentZoom < 8) {
        setTimeout(() => map.setZoom(CITY_ZOOM), 300);
      } else {
        map.setZoom(CITY_ZOOM);
      }
    } else if (prevCityRef.current && !selectedCity) {
      map.setZoom(DEFAULT_ZOOM);
      setTimeout(() => map.panTo(DEFAULT_CENTER), 200);
    }

    prevCityRef.current = selectedCity;
  }, [map, selectedCity]);

  return null;
}

interface Props {
  selectedCity: SelectedCity | null;
  pois: POI[];
  visibleIds: Set<string>;
  shortlistIds: Set<string>;
  highlightedPoiId: string | null;
  onMarkerClick: (placeId: string) => void;
  onPoisLoaded: (pois: POI[]) => void;
  onLoadingChange: (loading: boolean) => void;
  routeState: RouteState | null;
  shortlist: POI[];
  hoveredHopOptionId: string | null;
  suggestionPreviewPos: { lat: number; lng: number } | null;
}

export default function MapArea({
  selectedCity,
  pois,
  visibleIds,
  shortlistIds,
  highlightedPoiId,
  onMarkerClick,
  onPoisLoaded,
  onLoadingChange,
  routeState,
  shortlist,
  hoveredHopOptionId,
  suggestionPreviewPos,
}: Props) {
  const inRouteMode = routeState !== null;
  return (
    <div className="flex-1 relative overflow-hidden">
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        disableDefaultUI
        gestureHandling="greedy"
        styles={DARK_MAP_STYLES}
        style={{ width: "100%", height: "100%" }}
      >
        <MapController selectedCity={selectedCity} />
        <POIFetcher
          selectedCity={selectedCity}
          onPoisLoaded={onPoisLoaded}
          onLoadingChange={onLoadingChange}
        />
        <MapMarkers
          pois={pois}
          visibleIds={visibleIds}
          shortlistIds={shortlistIds}
          highlightedId={highlightedPoiId}
          onMarkerClick={onMarkerClick}
          hideAll={inRouteMode}
        />
        <RouteMapLayer routeState={routeState} shortlist={shortlist} hoveredHopOptionId={hoveredHopOptionId} suggestionPreviewPos={suggestionPreviewPos} />
      </Map>

      {/* Overlay when no city selected */}
      {!selectedCity && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(20,18,16,0.4)" }}
        >
          <div className="flex flex-col items-center gap-3 select-none">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(46,43,39,0.95)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "var(--muted)" }}
              >
                <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M12 2C7.03 2 3 6.03 3 11C3 16.25 10.5 22 12 22C13.5 22 21 16.25 21 11C21 6.03 16.97 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <p
              className="text-base font-medium"
              style={{
                color: "var(--foreground)",
                fontFamily: "var(--font-dm-sans)",
                letterSpacing: "0.01em",
              }}
            >
              Select a city to explore
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
