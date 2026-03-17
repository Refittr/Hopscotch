"use client";

import { useEffect, useRef, useState } from "react";
import type { POI } from "@/types/poi";
import { getCategoryEmoji } from "@/lib/placesCategories";

interface Props {
  poi: POI;
  highlighted: boolean;
  isShortlisted: boolean;
  onAdd: (poi: POI) => void;
  onRemove?: (placeId: string) => void;
  onHighlight?: (placeId: string | null) => void;
  index?: number;
  distanceMi?: number;
  onOpenDetail?: (poi: POI) => void;
}

export default function POICard({
  poi,
  highlighted,
  isShortlisted,
  onAdd,
  onRemove,
  onHighlight,
  index = 0,
  distanceMi,
  onOpenDetail,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className="poi-card poi-enter flex items-center gap-3 p-2.5 rounded-lg cursor-pointer"
      onClick={() => onOpenDetail?.(poi)}
      onMouseEnter={() => onHighlight?.(poi.placeId)}
      onMouseLeave={() => onHighlight?.(null)}
      style={{
        background: highlighted ? "var(--accent-dim)" : "var(--input-bg)",
        border: `1px solid ${highlighted ? "var(--accent)" : "var(--border)"}`,
        transition: "border-color 0.2s, background 0.2s",
        animationDelay: `${Math.min(index * 30, 300)}ms`,
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-12 h-12 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: "var(--border)", fontSize: "20px" }}
      >
        {poi.photoUrl && !imgError ? (
          <>
            {!imgLoaded && <div className="skeleton absolute inset-0" />}
            <img
              src={poi.photoUrl}
              alt={poi.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.2s ease" }}
            />
          </>
        ) : (
          <span>{getCategoryEmoji(poi.category)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className="text-sm font-medium truncate leading-tight min-w-0"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
          >
            {poi.name}
          </p>
          <span
            className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full"
            style={{
              background: "var(--border)",
              color: "var(--muted)",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "9px",
              letterSpacing: "0.04em",
            }}
          >
            info
          </span>
        </div>
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
          {distanceMi != null && (
            <span style={{ color: "var(--muted)", marginLeft: "6px" }}>
              · {distanceMi < 0.1 ? "< 0.1 mi" : `${distanceMi.toFixed(1)} mi`}
            </span>
          )}
        </p>
        {poi.rating != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ color: "#f59e0b", fontSize: "11px", lineHeight: 1 }}>★</span>
            <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
              {poi.rating.toFixed(1)}
              {poi.ratingsCount != null && (
                <span style={{ color: "var(--border)" }}>
                  {" "}({poi.ratingsCount.toLocaleString()})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Add / shortlisted button */}
      <button
        className="add-btn w-10 h-10 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: isShortlisted ? "var(--accent-secondary)" : "var(--accent-dim)",
          border: `1px solid ${isShortlisted ? "var(--accent-secondary)" : "var(--accent)"}`,
          color: isShortlisted ? "#fff" : "var(--accent)",
          opacity: isShortlisted ? 1 : undefined,
          cursor: "pointer",
          boxShadow: isShortlisted ? "0 0 8px rgba(255, 45, 120, 0.35)" : "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isShortlisted) onRemove?.(poi.placeId);
          else onAdd(poi);
        }}
        aria-label={isShortlisted ? `Remove ${poi.name} from list` : `Add ${poi.name} to list`}
      >
        {isShortlisted ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
