"use client";

import type { POI } from "@/types/poi";
import POICard from "./POICard";

interface Props {
  pois: POI[];
  isLoading: boolean;
  highlightedPoiId: string | null;
  hasCity: boolean;
  shortlistIds: Set<string>;
  onAddToShortlist: (poi: POI) => void;
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
}: Props) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: "320px",
        minWidth: "320px",
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
        {!isLoading && pois.length > 0 && (
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
            loading…
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {isLoading && (
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
            <p
              className="text-sm text-center"
              style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
            >
              Search a city to<br />discover spots
            </p>
          </div>
        )}

        {!isLoading && hasCity && pois.length === 0 && (
          <div className="flex items-center justify-center h-full py-16">
            <p
              className="text-sm text-center"
              style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
            >
              No spots match<br />the active filters
            </p>
          </div>
        )}

        {!isLoading && pois.length > 0 && (
          <div className="flex flex-col gap-2">
            {pois.map((poi) => (
              <POICard
                key={poi.placeId}
                poi={poi}
                highlighted={poi.placeId === highlightedPoiId}
                isShortlisted={shortlistIds.has(poi.placeId)}
                onAdd={onAddToShortlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
