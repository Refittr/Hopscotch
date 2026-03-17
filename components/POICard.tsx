"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { POI } from "@/types/poi";
import { getCategoryEmoji } from "@/lib/placesCategories";

function InfoTooltip({ poi, index }: { poi: POI; index: number }) {
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [description, setDescription] = useState<string | null>(null);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const fetchedRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const stars = poi.rating ? Math.round(poi.rating) : 0;

  useEffect(() => {
    if (!visible || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoadingDesc(true);
    fetch(`/api/place-details?placeId=${encodeURIComponent(poi.placeId)}`)
      .then((r) => r.json())
      .then((d) => setDescription(d.description ?? null))
      .catch(() => {})
      .finally(() => setLoadingDesc(false));
  }, [visible, poi.placeId]);

  const showTooltip = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const style: React.CSSProperties = {
      position: "fixed",
      width: "220px",
      right: window.innerWidth - rect.right,
      zIndex: 9999,
    };
    if (spaceBelow < 280) {
      style.bottom = window.innerHeight - rect.top + 8;
    } else {
      style.top = rect.bottom + 8;
    }
    setTooltipStyle(style);
    setVisible(true);
  };

  return (
    <div className="relative flex-shrink-0" style={{ lineHeight: 0 }}>
      <button
        ref={btnRef}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => { e.stopPropagation(); visible ? setVisible(false) : showTooltip(); }}
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
      {visible && createPortal(
        <div
          className="rounded-xl"
          style={{
            ...tooltipStyle,
            width: "220px",
            background: "#1a1714",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--input-bg)" }}>
            <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
              {getCategoryEmoji(poi.category)} {poi.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--accent)", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "9px" }}>
              {poi.category}
            </p>
          </div>

          <div className="px-3 py-2.5 flex flex-col gap-2">
            {/* Description */}
            {loadingDesc && (
              <div className="flex gap-1 flex-col">
                <div className="skeleton h-2 rounded w-full" />
                <div className="skeleton h-2 rounded w-4/5" />
              </div>
            )}
            {!loadingDesc && description && (
              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
                {description}
              </p>
            )}

            {/* Vicinity */}
            {poi.vicinity && (
              <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)", fontSize: "10px" }}>
                📍 {poi.vicinity}
              </p>
            )}

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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

interface Props {
  poi: POI;
  highlighted: boolean;
  isShortlisted: boolean;
  onAdd: (poi: POI) => void;
  onRemove?: (placeId: string) => void;
  onHighlight?: (placeId: string | null) => void;
  index?: number;
  distanceMi?: number;
}

export default function POICard({ poi, highlighted, isShortlisted, onAdd, onRemove, onHighlight, index = 0, distanceMi }: Props) {
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
          {distanceMi != null && (
            <span style={{ color: "var(--muted)", marginLeft: "6px" }}>
              · {distanceMi < 0.1 ? "< 0.1 mi" : `${distanceMi.toFixed(1)} mi`}
            </span>
          )}
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

      <InfoTooltip poi={poi} index={index} />

      {/* Google Maps link */}
      <a
        href={`https://www.google.com/maps/place/?q=place_id:${poi.placeId}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: "var(--muted)", background: "var(--border)" }}
        aria-label={`Open ${poi.name} in Google Maps`}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>

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
