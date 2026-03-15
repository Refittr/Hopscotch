"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import Sidebar from "@/components/Sidebar";
import BrowsePanel from "@/components/BrowsePanel";
import RouteMode from "@/components/RouteMode";
import MapArea from "@/components/MapArea";
import MobileSidebar from "@/components/MobileSidebar";
import Toast, { ToastStack, useToasts } from "@/components/Toast";
import type { POI } from "@/types/poi";
import type { RouteState, HopOption, HopPosition } from "@/types/route";
import { poiMatchesVibes } from "@/lib/placesCategories";
import { computeHopOptions, haversineKm } from "@/lib/routeUtils";

export interface SelectedCity {
  name: string;
  lat: number;
  lng: number;
}

const MAX_SHORTLIST = 15;

export default function Home() {
  // ── Planning state ──────────────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeVibes, setActiveVibes] = useState<Set<string>>(new Set());
  const [highlightedPoiId, setHighlightedPoiId] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<POI[]>([]);
  const [showMaxToast, setShowMaxToast] = useState(false);
  const { toasts, push: pushToast, remove: removeToast } = useToasts();

  // ── Route state ─────────────────────────────────────────────────────────
  const [routeState, setRouteState] = useState<RouteState | null>(null);
  const [hoveredHopOptionId, setHoveredHopOptionId] = useState<string | null>(null);
  const [suggestionPreviewPos, setSuggestionPreviewPos] = useState<{ lat: number; lng: number } | null>(null);
  const aiCallKeyRef = useRef<string>("");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  // ── Derived ─────────────────────────────────────────────────────────────
  const shortlistIds = useMemo(
    () => new Set(shortlist.map((p) => p.placeId)),
    [shortlist]
  );

  const filteredPois = useMemo(
    () => pois.filter((poi) => poiMatchesVibes(poi, activeVibes)),
    [pois, activeVibes]
  );

  const visibleIds = useMemo(
    () => new Set(filteredPois.map((p) => p.placeId)),
    [filteredPois]
  );

  // ── Planning callbacks ──────────────────────────────────────────────────
  const toggleVibe = useCallback((label: string) => {
    setActiveVibes((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

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

  const handleAddToShortlist = useCallback((poi: POI) => {
    setShortlist((prev) => {
      if (prev.some((p) => p.placeId === poi.placeId)) return prev;
      if (prev.length >= MAX_SHORTLIST) {
        setShowMaxToast(true);
        return prev;
      }
      pushToast(`Added — ${poi.name}`, "✦");
      return [...prev, poi];
    });
  }, [pushToast]);

  const handleRemoveFromShortlist = useCallback((placeId: string) => {
    setShortlist((prev) => {
      const item = prev.find((p) => p.placeId === placeId);
      if (item) pushToast(`Removed — ${item.name}`, "✕");
      return prev.filter((p) => p.placeId !== placeId);
    });
  }, [pushToast]);

  const handleReorderShortlist = useCallback((newList: POI[]) => {
    setShortlist(newList);
  }, []);

  // ── AI suggestion fetch ─────────────────────────────────────────────────
  const fetchAISuggestion = useCallback(
    async (
      currentPosition: HopPosition,
      hopOptions: HopOption[],
      cityName: string
    ) => {
      if (!hopOptions.length) return;
      try {
        const nearbyBrowsePOIs = pois
          .filter((p) => !shortlistIds.has(p.placeId))
          .map((p) => ({
            name: p.name,
            category: p.category,
            rating: p.rating,
            distKm: haversineKm(
              { lat: currentPosition.lat, lng: currentPosition.lng },
              { lat: p.lat, lng: p.lng }
            ),
          }))
          .sort((a, b) => a.distKm - b.distKm)
          .slice(0, 20)
          .map(({ name, category, rating }) => ({ name, category, rating }));

        const shortlistContext = shortlist.map((p) => ({
          name: p.name,
          category: p.category,
        }));

        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentSpot: {
              name: currentPosition.name,
              category:
                "isGeolocation" in currentPosition
                  ? "Location"
                  : (currentPosition as POI).category,
            },
            city: cityName,
            options: hopOptions.map((o) => ({
              name: o.poi.name,
              category: o.poi.category,
              directionHint: o.directionHint,
            })),
            activeVibes: Array.from(activeVibes),
            nearbyBrowsePOIs,
            shortlistContext,
          }),
        });
        if (!res.ok) throw new Error("non-200");
        const data = await res.json();
        setRouteState((prev) => {
          if (!prev || prev.phase !== "hopping") return prev;
          return { ...prev, aiSuggestion: data, aiLoading: false };
        });
      } catch {
        setRouteState((prev) => {
          if (!prev || prev.phase !== "hopping") return prev;
          return { ...prev, aiLoading: false };
        });
      }
    },
    [pois, shortlistIds, activeVibes]
  );

  // Fire AI when hop options change
  useEffect(() => {
    if (!routeState || routeState.phase !== "hopping" || !routeState.aiLoading)
      return;
    const key = routeState.hopOptions.map((o) => o.poi.placeId).join(",");
    if (key === aiCallKeyRef.current) return;
    aiCallKeyRef.current = key;
    fetchAISuggestion(
      routeState.currentPosition,
      routeState.hopOptions,
      routeState.cityName
    );
  }, [routeState, fetchAISuggestion]);

  // ── Route callbacks ─────────────────────────────────────────────────────
  const handleStartRoute = useCallback(() => {
    setRouteState({ phase: "picking_start" });
  }, []);

  const handlePickStart = useCallback(
    (start: POI | { lat: number; lng: number; name: string; isGeolocation: true }) => {
      const startCoords = { lat: start.lat, lng: start.lng };
      const remaining =
        "placeId" in start
          ? shortlist.filter((p) => p.placeId !== start.placeId)
          : [...shortlist];
      const hopOptions = computeHopOptions(startCoords, remaining, 3);
      const cityName = selectedCity?.name ?? "";

      setRouteState({
        phase: "hopping",
        cityName,
        currentPosition: start,
        visitedIds: new Set("placeId" in start ? [start.placeId] : []),
        remainingPois: remaining,
        completedHops: [],
        hopOptions,
        aiSuggestion: null,
        aiLoading: hopOptions.length > 0,
      });
      aiCallKeyRef.current = "";
    },
    [shortlist, selectedCity]
  );

  const handleHopSelect = useCallback(
    (option: HopOption) => {
      if (!routeState || routeState.phase !== "hopping") return;

      const { currentPosition, visitedIds, completedHops } = routeState;

      const newHop = {
        from: currentPosition,
        to: option.poi,
        walkMinutes: option.walkMinutes,
        distanceKm: option.distanceKm,
      };

      const newVisitedIds = new Set([...visitedIds, option.poi.placeId]);
      const newRemaining = routeState.remainingPois.filter(
        (p) => p.placeId !== option.poi.placeId
      );
      const newAllHops = [...completedHops, newHop];

      if (newRemaining.length === 0) {
        const totalWalk = newAllHops.reduce((s, h) => s + h.walkMinutes, 0);
        const totalDist = newAllHops.reduce((s, h) => s + h.distanceKm, 0);
        setRouteState({
          phase: "complete",
          cityName: routeState.cityName,
          completedHops: newAllHops,
          totalWalkMinutes: totalWalk,
          totalDistanceKm: totalDist,
        });
        return;
      }

      const newPos = { lat: option.poi.lat, lng: option.poi.lng, name: option.poi.name };
      const newHopOptions = computeHopOptions(newPos, newRemaining, 3);

      setRouteState({
        phase: "hopping",
        cityName: routeState.cityName,
        currentPosition: option.poi,
        visitedIds: newVisitedIds,
        remainingPois: newRemaining,
        completedHops: newAllHops,
        hopOptions: newHopOptions,
        aiSuggestion: null,
        aiLoading: newHopOptions.length > 0,
      });
      aiCallKeyRef.current = "";
    },
    [routeState]
  );

  const handleAddAISuggestion = useCallback(
    (name: string) => {
      // Find the POI in browse results by name (case-insensitive)
      const matched = pois.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (!matched) return;

      // Add to shortlist
      handleAddToShortlist(matched);

      // Add to route remaining + recalculate hop options
      setRouteState((prev) => {
        if (!prev || prev.phase !== "hopping") return prev;
        if (prev.remainingPois.some((p) => p.placeId === matched.placeId))
          return prev;
        const newRemaining = [...prev.remainingPois, matched];
        const newHopOptions = computeHopOptions(
          { lat: prev.currentPosition.lat, lng: prev.currentPosition.lng },
          newRemaining,
          3
        );
        return {
          ...prev,
          remainingPois: newRemaining,
          hopOptions: newHopOptions,
          aiSuggestion: null,
          aiLoading: false,
        };
      });
    },
    [pois, handleAddToShortlist]
  );

  const handleRemoveFromRoute = useCallback((placeId: string) => {
    handleRemoveFromShortlist(placeId);
    setRouteState((prev) => {
      if (!prev || prev.phase !== "hopping") return prev;
      const newRemaining = prev.remainingPois.filter((p) => p.placeId !== placeId);
      const newHopOptions = computeHopOptions(
        { lat: prev.currentPosition.lat, lng: prev.currentPosition.lng },
        newRemaining,
        3
      );
      return { ...prev, remainingPois: newRemaining, hopOptions: newHopOptions };
    });
  }, [handleRemoveFromShortlist]);

  const handleSuggestionHover = useCallback((hovering: boolean) => {
    if (!hovering) { setSuggestionPreviewPos(null); return; }
    setRouteState((prev) => {
      if (!prev || prev.phase !== "hopping" || !prev.aiSuggestion) return prev;
      const poi = pois.find(
        (p) => p.name.toLowerCase() === prev.aiSuggestion!.name.toLowerCase()
      );
      if (poi) setSuggestionPreviewPos({ lat: poi.lat, lng: poi.lng });
      return prev;
    });
  }, [pois]);

  const handleUndoLastHop = useCallback(() => {
    setRouteState((prev) => {
      if (!prev || prev.phase !== "hopping" || prev.completedHops.length === 0) return prev;
      const lastHop = prev.completedHops[prev.completedHops.length - 1];
      const newCompletedHops = prev.completedHops.slice(0, -1);
      const restoredRemaining = [...prev.remainingPois, lastHop.to];
      const newVisitedIds = new Set(prev.visitedIds);
      newVisitedIds.delete(lastHop.to.placeId);
      const newHopOptions = computeHopOptions(
        { lat: lastHop.from.lat, lng: lastHop.from.lng },
        restoredRemaining,
        3
      );
      return {
        ...prev,
        currentPosition: lastHop.from,
        visitedIds: newVisitedIds,
        remainingPois: restoredRemaining,
        completedHops: newCompletedHops,
        hopOptions: newHopOptions,
        aiSuggestion: null,
        aiLoading: newHopOptions.length > 0,
      };
    });
    aiCallKeyRef.current = "";
  }, []);

  const handleFinishRoute = useCallback(() => {
    if (!routeState || routeState.phase !== "hopping") return;
    const { completedHops } = routeState;
    const totalWalk = completedHops.reduce((s, h) => s + h.walkMinutes, 0);
    const totalDist = completedHops.reduce((s, h) => s + h.distanceKm, 0);
    setRouteState({
      phase: "complete",
      cityName: routeState.cityName,
      completedHops,
      totalWalkMinutes: totalWalk,
      totalDistanceKm: totalDist,
    });
  }, [routeState]);

  const handleStartOver = useCallback(() => {
    aiCallKeyRef.current = "";
    setRouteState({ phase: "picking_start" });
  }, []);

  const handleBackToPlanning = useCallback(() => {
    aiCallKeyRef.current = "";
    setRouteState(null);
  }, []);

  // ── Prop bundles ────────────────────────────────────────────────────────
  const sidebarProps = {
    selectedCity,
    onCitySelect: handleCitySelect,
    filteredPois,
    isLoading,
    activeVibes,
    onVibeToggle: toggleVibe,
    highlightedPoiId,
    shortlist,
    shortlistIds,
    onAddToShortlist: handleAddToShortlist,
    onRemoveFromShortlist: handleRemoveFromShortlist,
    onReorderShortlist: handleReorderShortlist,
    onStartRoute: handleStartRoute,
  };

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <div className="flex h-screen" style={{ overflow: "clip" }}>
        {/* Desktop panels */}
        <div className="hidden md:flex">
          {routeState ? (
            <RouteMode
              routeState={routeState}
              shortlist={shortlist}
              browsePOIs={filteredPois}
              onPickStart={handlePickStart}
              onHopSelect={handleHopSelect}
              onAddAISuggestion={handleAddAISuggestion}
              onUndoLastHop={handleUndoLastHop}
              onRemoveFromRoute={handleRemoveFromRoute}
              onFinishRoute={handleFinishRoute}
              onStartOver={handleStartOver}
              onBackToPlanning={handleBackToPlanning}
              onSpotHover={setHoveredHopOptionId}
              onSuggestionHover={handleSuggestionHover}
              onToast={pushToast}
            />
          ) : (
            <>
              <Sidebar {...sidebarProps} />
              <BrowsePanel
                pois={filteredPois}
                isLoading={isLoading}
                highlightedPoiId={highlightedPoiId}
                hasCity={selectedCity != null}
                shortlistIds={shortlistIds}
                onAddToShortlist={handleAddToShortlist}
                onHighlight={setHighlightedPoiId}
              />
            </>
          )}
        </div>

        {/* Map */}
        <MapArea
          selectedCity={selectedCity}
          pois={pois}
          visibleIds={visibleIds}
          shortlistIds={shortlistIds}
          highlightedPoiId={highlightedPoiId}
          onMarkerClick={setHighlightedPoiId}
          onPoisLoaded={handlePoisLoaded}
          onLoadingChange={handleLoadingChange}
          routeState={routeState}
          shortlist={shortlist}
          hoveredHopOptionId={hoveredHopOptionId}
          suggestionPreviewPos={suggestionPreviewPos}
        />

        {/* Mobile */}
        <MobileSidebar {...sidebarProps} />
      </div>

      <Toast
        message="Max 15 spots per route"
        visible={showMaxToast}
        onDone={() => setShowMaxToast(false)}
      />
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </APIProvider>
  );
}
