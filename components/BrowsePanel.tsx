"use client";

import { useMemo, useState } from "react";
import type { POI } from "@/types/poi";
import POICard from "./POICard";
import { haversineKm } from "@/lib/routeUtils";

interface Props {
  pois: POI[];
  isLoading: boolean;
  highlightedPoiId: string | null;
  hasCity: boolean;
  shortlistIds: Set<string>;
  onAddToShortlist: (poi: POI) => void;
  onRemoveFromShortlist?: (placeId: string) => void;
  onHighlight: (placeId: string | null) => void;
  fullWidth?: boolean;
  nearMe?: boolean;
  onNearMeToggle?: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

function SkeletonCard() {
  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg"
      style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
    >
      <div className="skeleton w-12 h-12 rounded-md flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-3 rounded w-3/4" />
        <div className="skeleton h-2 rounded w-1/3" />
        <div className="skeleton h-2 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function BrowsePanel({
  pois,
  isLoading,
  highlightedPoiId,
  hasCity,
  shortlistIds,
  onAddToShortlist,
  onRemoveFromShortlist,
  onHighlight,
  fullWidth,
  nearMe = false,
  onNearMeToggle,
  userLocation,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? pois.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pois;

  const poisWithDist = useMemo(() => {
    if (!nearMe || !userLocation) return filtered.map((p) => ({ poi: p, distMi: undefined as number | undefined }));
    return [...filtered]
      .map((p) => ({
        poi: p,
        distMi: haversineKm({ lat: p.lat, lng: p.lng }, userLocation) * 0.621371,
      }))
      .sort((a, b) => a.distMi - b.distMi);
  }, [filtered, nearMe, userLocation]);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: "100%",
        maxWidth: fullWidth ? "100%" : "400px",
        background: "var(--background)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          Browse
        </span>
        {pois.length > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              color: "var(--accent)",
              background: "var(--accent-dim)",
              fontFamily: "var(--font-dm-sans)",
              border: "1px solid rgba(0,240,255,0.15)",
            }}
          >
            {pois.length} spots
          </span>
        )}
        {isLoading && (
          <span
            className="text-xs"
            style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
          >
            {pois.length > 0 ? "loading more…" : "loading…"}
          </span>
        )}
        <div className="flex-1" />
        {onNearMeToggle && (
          <button
            onClick={onNearMeToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: nearMe ? "rgba(74,144,226,0.15)" : "var(--input-bg)",
              border: `1px solid ${nearMe ? "#4A90E2" : "var(--border)"}`,
              color: nearMe ? "#4A90E2" : "var(--muted)",
              fontFamily: "var(--font-dm-sans)",
              boxShadow: nearMe ? "0 0 10px rgba(74,144,226,0.2)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.5 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            Near me
          </button>
        )}
      </div>

      {/* Search */}
      {pois.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
          >
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none" style={{ color: "var(--muted)", flexShrink: 0 }}>
              <path d="M10 6.5C10 8.43 8.43 10 6.5 10C4.57 10 3 8.43 3 6.5C3 4.57 4.57 3 6.5 3C8.43 3 10 4.57 10 6.5ZM9.44 10.15L12.15 12.85" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter spots…"
              className="flex-1 bg-transparent text-xs outline-none min-w-0"
              style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: "var(--muted)", lineHeight: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {isLoading && pois.length === 0 && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!isLoading && !hasCity && (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: "var(--border)" }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-center" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
              Search a city to<br />discover spots
            </p>
          </div>
        )}

        {!isLoading && hasCity && pois.length === 0 && (
          <div className="flex items-center justify-center h-full py-16">
            <p className="text-sm text-center" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
              No spots match<br />the active filters
            </p>
          </div>
        )}

        {pois.length > 0 && (
          <div className="flex flex-col gap-2">
            {poisWithDist.map(({ poi, distMi }, i) => (
              <POICard
                key={poi.placeId}
                poi={poi}
                highlighted={poi.placeId === highlightedPoiId}
                isShortlisted={shortlistIds.has(poi.placeId)}
                onAdd={onAddToShortlist}
                onRemove={onRemoveFromShortlist}
                onHighlight={onHighlight}
                index={i}
                distanceMi={distMi}
              />
            ))}
            <div style={{ height: "40px" }} />
          </div>
        )}
      </div>
    </div>
  );
}
