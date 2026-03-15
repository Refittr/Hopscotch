"use client";

import { useEffect, useRef, useState } from "react";
import type { POI } from "@/types/poi";
import { getCategoryEmoji } from "@/lib/placesCategories";

interface Props {
  poi: POI;
  highlighted: boolean;
}

export default function POICard({ poi, highlighted }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Scroll into view + flash on highlight
  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className="poi-card flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer group"
      style={{
        background: highlighted ? "var(--accent-dim)" : "var(--input-bg)",
        border: `1px solid ${highlighted ? "var(--accent)" : "var(--border)"}`,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {/* Thumbnail */}
      <div
        className="w-12 h-12 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
        style={{ background: "var(--border)" }}
      >
        {poi.photoUrl && !imgError ? (
          <img
            src={poi.photoUrl}
            alt={poi.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: "20px" }}>{getCategoryEmoji(poi.category)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate leading-tight"
          style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
        >
          {poi.name}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{
            color: "var(--accent)",
            fontFamily: "var(--font-dm-sans)",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            fontSize: "10px",
          }}
        >
          {poi.category}
        </p>
        {poi.rating != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ color: "#f59e0b", fontSize: "11px", lineHeight: 1 }}>★</span>
            <span
              className="text-xs"
              style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
            >
              {poi.rating.toFixed(1)}
              {poi.ratingsCount != null && (
                <span style={{ color: "var(--border)" }}>
                  {" "}
                  ({poi.ratingsCount.toLocaleString()})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Add to list button — shown on hover */}
      <button
        className="add-btn w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
        style={{
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          color: "var(--accent)",
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Add ${poi.name} to list`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M5 1V9M1 5H9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
