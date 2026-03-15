"use client";

import { useEffect, useRef, useState } from "react";
import type { POI } from "@/types/poi";
import { getCategoryEmoji } from "@/lib/placesCategories";

const SKIP_TYPES = new Set([
  "point_of_interest", "establishment", "food", "store", "premise",
  "political", "locality", "geocode", "route",
]);

function InfoTooltip({ poi }: { poi: POI }) {
  const [visible, setVisible] = useState(false);
  const tags = poi.types
    .filter((t) => !SKIP_TYPES.has(t))
    .slice(0, 4)
    .map((t) => t.replace(/_/g, " "));
  const stars = poi.rating ? Math.round(poi.rating) : 0;

  return (
    <div className="relative flex-shrink-0" style={{ lineHeight: 0 }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => { e.stopPropagation(); setVisible((v) => !v); }}
        className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center rounded-full transition-colors"
        style={{
          background: "var(--border)",
          color: "var(--muted)",
          fontSize: "11px",
          fontStyle: "italic",
          fontWeight: 700,
          fontFamily: "serif",
        }}
        aria-label="Info"
      >
        i
      </button>
      {visible && (
        <div
          className="absolute z-50 rounded-xl"
          style={{
            bottom: "calc(100% + 8px)",
            right: 0,
            width: "200px",
            background: "#1a1714",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          {/* Header strip */}
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--input-bg)" }}>
            <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
              {getCategoryEmoji(poi.category)} {poi.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "9px" }}>
              {poi.category}
            </p>
            {poi.vicinity && (
              <p className="text-xs mt-1" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)", fontSize: "10px" }}>
                📍 {poi.vicinity}
              </p>
            )}
          </div>

          <div className="px-3 py-2.5 flex flex-col gap-2">
            {/* Rating */}
            {poi.rating != null && (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <span key={n} style={{ color: n <= stars ? "#f59e0b" : "var(--border)", fontSize: "10px" }}>★</span>
                  ))}
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
                  {poi.rating.toFixed(1)}
                </span>
                {poi.ratingsCount != null && (
                  <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                    ({poi.ratingsCount >= 1000 ? `${(poi.ratingsCount / 1000).toFixed(1)}k` : poi.ratingsCount})
                  </span>
                )}
              </div>
            )}

            {/* Open status */}
            {poi.isOpen != null && (
              <div className="flex items-center gap-1.5">
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: poi.isOpen ? "#4ade80" : "#f87171", flexShrink: 0 }} />
                <span className="text-xs" style={{ color: poi.isOpen ? "#4ade80" : "#f87171", fontFamily: "var(--font-dm-sans)" }}>
                  {poi.isOpen ? "Open now" : "Currently closed"}
                </span>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-xs capitalize"
                    style={{ background: "var(--border)", color: "var(--muted)", fontFamily: "var(--font-dm-sans)", fontSize: "9px" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  poi: POI;
  highlighted: boolean;
  isShortlisted: boolean;
  onAdd: (poi: POI) => void;
  onHighlight?: (placeId: string | null) => void;
  index?: number;
}

export default function POICard({ poi, highlighted, isShortlisted, onAdd, onHighlight, index = 0 }: Props) {
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
                  {" "}({poi.ratingsCount.toLocaleString()})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <InfoTooltip poi={poi} />

      {/* Add / shortlisted button */}
      <button
        className="add-btn w-10 h-10 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: isShortlisted ? "var(--accent-secondary)" : "var(--accent-dim)",
          border: `1px solid ${isShortlisted ? "var(--accent-secondary)" : "var(--accent)"}`,
          color: isShortlisted ? "#fff" : "var(--accent)",
          opacity: isShortlisted ? 1 : undefined,
          cursor: isShortlisted ? "default" : "pointer",
          boxShadow: isShortlisted ? "0 0 8px rgba(255, 45, 120, 0.35)" : "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isShortlisted) onAdd(poi);
        }}
        aria-label={isShortlisted ? "Already in list" : `Add ${poi.name} to list`}
      >
        {isShortlisted ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
