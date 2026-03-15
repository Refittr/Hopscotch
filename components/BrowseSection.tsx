"use client";

import type { POI } from "@/types/poi";
import POICard from "./POICard";

interface Props {
  pois: POI[];
  isLoading: boolean;
  highlightedPoiId: string | null;
  hasCity: boolean;
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
      <div className="skeleton w-12 h-12 rounded-md flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-3 rounded w-3/4" />
        <div className="skeleton h-2 rounded w-1/3" />
        <div className="skeleton h-2 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function BrowseSection({ pois, isLoading, highlightedPoiId, hasCity }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-5 pb-3 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          Browse
        </span>
        {!isLoading && pois.length > 0 && (
          <span
            className="text-xs"
            style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
          >
            — {pois.length} spot{pois.length !== 1 ? "s" : ""}
          </span>
        )}
        {isLoading && (
          <span
            className="text-xs"
            style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
          >
            — loading…
          </span>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state — no city selected */}
      {!isLoading && !hasCity && (
        <p
          className="text-xs text-center py-6"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          Search a city above to discover spots
        </p>
      )}

      {/* Empty state — city selected but no results */}
      {!isLoading && hasCity && pois.length === 0 && (
        <p
          className="text-xs text-center py-6"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          No spots match the active filters
        </p>
      )}

      {/* POI cards */}
      {!isLoading && pois.length > 0 && (
        <div className="flex flex-col gap-2">
          {pois.map((poi) => (
            <POICard
              key={poi.placeId}
              poi={poi}
              highlighted={poi.placeId === highlightedPoiId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
