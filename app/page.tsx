"use client";

import { useState, useCallback, useMemo } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import Sidebar from "@/components/Sidebar";
import MapArea from "@/components/MapArea";
import MobileSidebar from "@/components/MobileSidebar";
import type { POI } from "@/types/poi";
import { poiMatchesVibes } from "@/lib/placesCategories";

export interface SelectedCity {
  name: string;
  lat: number;
  lng: number;
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeVibes, setActiveVibes] = useState<Set<string>>(new Set());
  const [highlightedPoiId, setHighlightedPoiId] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const toggleVibe = useCallback((label: string) => {
    setActiveVibes((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const filteredPois = useMemo(
    () => pois.filter((poi) => poiMatchesVibes(poi, activeVibes)),
    [pois, activeVibes]
  );

  const visibleIds = useMemo(
    () => new Set(filteredPois.map((p) => p.placeId)),
    [filteredPois]
  );

  const handlePoisLoaded = useCallback((loaded: POI[]) => {
    setPois(loaded);
    setHighlightedPoiId(null);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleCitySelect = useCallback((city: SelectedCity | null) => {
    setSelectedCity(city);
    if (!city) {
      setPois([]);
      setHighlightedPoiId(null);
      setActiveVibes(new Set());
    }
  }, []);

  const sidebarProps = {
    selectedCity,
    onCitySelect: handleCitySelect,
    filteredPois,
    isLoading,
    activeVibes,
    onVibeToggle: toggleVibe,
    highlightedPoiId,
  };

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar {...sidebarProps} />
        </div>

        {/* Map */}
        <MapArea
          selectedCity={selectedCity}
          pois={pois}
          visibleIds={visibleIds}
          highlightedPoiId={highlightedPoiId}
          onMarkerClick={setHighlightedPoiId}
          onPoisLoaded={handlePoisLoaded}
          onLoadingChange={handleLoadingChange}
        />

        {/* Mobile bottom sheet */}
        <MobileSidebar {...sidebarProps} />
      </div>
    </APIProvider>
  );
}
