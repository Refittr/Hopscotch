"use client";

import { useEffect, useRef, useState } from "react";
import type { POI } from "@/types/poi";
import { getCategoryEmoji } from "@/lib/placesCategories";

declare global {
  interface Window {
    gyg?: { widgets: { init: () => void } };
  }
}

const FOOD_CATEGORIES = new Set([
  "Restaurant", "Café", "Bakery", "Bar", "Nightlife",
]);

const GYG_PARTNER_ID = "XHNEI9V";

function GygWidgetSection({
  poiId,
  poiName,
  poiCategory,
  cityName,
}: {
  poiId: string;
  poiName: string;
  poiCategory: string;
  cityName: string;
}) {
  const [hidden, setHidden] = useState(false);

  // Food/drink spots rarely have specific tours — search city instead
  const query = FOOD_CATEGORIES.has(poiCategory)
    ? cityName
    : `${poiName} ${cityName}`;

  if (hidden) return null;

  return (
    <div>
      <div style={{ height: "1px", background: "var(--border)", margin: "0 16px" }} />
      <div className="px-4 pt-4 pb-5">
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          Tours &amp; experiences
        </p>
        <GygWidget query={query} poiId={poiId} onEmpty={() => setHidden(true)} />
      </div>
    </div>
  );
}

function GygWidget({ query, poiId, onEmpty }: { query: string; poiId: string; onEmpty: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEmptyRef = useRef(onEmpty);
  useEffect(() => { onEmptyRef.current = onEmpty; }, [onEmpty]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Stamp fresh widget div
    el.innerHTML = "";
    const widget = document.createElement("div");
    widget.setAttribute("data-gyg-widget", "auto");
    widget.setAttribute("data-gyg-partner-id", GYG_PARTNER_ID);
    widget.setAttribute("data-gyg-q", query);
    el.appendChild(widget);

    // Re-init the already-loaded GYG script for this new div
    if (window.gyg?.widgets?.init) {
      window.gyg.widgets.init();
    }

    // Hide section if no widget content appears within 6 s
    const timer = setTimeout(() => {
      const hasContent =
        el.querySelector("iframe") ||
        el.querySelector("[class*='gyg']") ||
        el.querySelector("[data-gyg-loaded]");
      if (!hasContent) onEmptyRef.current();
    }, 6000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, poiId]);

  return (
    <div
      ref={containerRef}
      style={{
        background: "var(--input-bg)",
        borderRadius: "12px",
        overflow: "hidden",
        minHeight: "120px",
      }}
    />
  );
}

export interface PlaceDetails {
  description: string | null;
  photos: string[];
  openNow: boolean | null;
  weekdayText: string[] | null;
  reviewSnippet: string | null;
}

interface Props {
  poi: POI;
  details: PlaceDetails | null;
  isLoadingDetails: boolean;
  isShortlisted: boolean;
  distanceMi?: number;
  cityName?: string;
  onClose: () => void;
  onAdd: (poi: POI) => void;
  onRemove: (placeId: string) => void;
}

export default function POIDetailCard({
  poi,
  details,
  isLoadingDetails,
  isShortlisted,
  distanceMi,
  cityName,
  onClose,
  onAdd,
  onRemove,
}: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const touchStartX = useRef<number | null>(null);

  const photos = details?.photos ?? [];

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  useEffect(() => { setPhotoIndex(0); setHoursOpen(false); }, [poi.placeId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleShare = async () => {
    const url = `https://www.google.com/maps/place/?q=place_id:${poi.placeId}`;
    if (navigator.share) {
      try { await navigator.share({ title: poi.name, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareLabel("Copied!");
        setTimeout(() => setShareLabel("Share"), 2000);
      } catch {}
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || photos.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      setPhotoIndex((prev) =>
        dx < 0
          ? (prev + 1) % photos.length
          : (prev - 1 + photos.length) % photos.length
      );
    }
    touchStartX.current = null;
  };

  const isOpen = details?.openNow ?? poi.isOpen ?? null;

  return (
    <div
      className="absolute inset-0 z-20"
      style={{ background: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="absolute inset-y-0 right-0 flex flex-col"
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--sidebar-bg)",
          borderLeft: "1px solid var(--border)",
          transform: mounted ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo area — always 200px */}
        <div
          className="relative flex-shrink-0"
          style={{ height: "200px", background: "var(--border)", overflow: "hidden" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isLoadingDetails && <div className="skeleton absolute inset-0" />}

          {!isLoadingDetails && photos.length > 0 && (
            <>
              <img
                key={photos[photoIndex]}
                src={photos[photoIndex]}
                alt={poi.name}
                className="w-full h-full object-cover"
                style={{ display: "block" }}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75) 100%)" }}
              />
              {photos.length > 1 && (
                <>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === photoIndex ? "18px" : "6px",
                          height: "6px",
                          background: i === photoIndex ? "white" : "rgba(255,255,255,0.45)",
                        }}
                      />
                    ))}
                  </div>
                  {/* Prev */}
                  {photoIndex > 0 && (
                    <button
                      onClick={() => setPhotoIndex((p) => p - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  {/* Next */}
                  {photoIndex < photos.length - 1 && (
                    <button
                      onClick={() => setPhotoIndex((p) => p + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* No photo fallback */}
          {!isLoadingDetails && photos.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <span style={{ fontSize: "48px", lineHeight: 1 }}>{getCategoryEmoji(poi.category)}</span>
            </div>
          )}

          {/* Close button — always top-right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
            style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Name / category / key info */}
          <div className="px-5 pt-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-start gap-2.5 mb-3">
              <div className="flex-1 min-w-0">
                <h2
                  className="text-base font-semibold leading-tight"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {poi.name}
                </h2>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: "var(--accent)",
                    fontFamily: "var(--font-dm-sans)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {poi.category}
                </p>
              </div>
            </div>

            {/* Key info chips */}
            <div className="flex flex-wrap items-center gap-2">
              {poi.rating != null && (
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
                >
                  <span style={{ color: "#f59e0b", fontSize: "12px" }}>★</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
                  >
                    {poi.rating.toFixed(1)}
                  </span>
                  {poi.ratingsCount != null && (
                    <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                      ({poi.ratingsCount >= 1000 ? `${(poi.ratingsCount / 1000).toFixed(1)}k` : poi.ratingsCount})
                    </span>
                  )}
                </div>
              )}

              {isOpen != null && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: isOpen ? "#4ade80" : "#f87171",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: isOpen ? "#4ade80" : "#f87171", fontFamily: "var(--font-dm-sans)" }}
                  >
                    {isOpen ? "Open now" : "Closed"}
                  </span>
                </div>
              )}

              {distanceMi != null && (
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)" }}>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.5 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                    {distanceMi < 0.1 ? "< 0.1 mi" : `${distanceMi.toFixed(1)} mi`}
                  </span>
                </div>
              )}
            </div>

            {poi.vicinity && (
              <p className="text-xs mt-2.5" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                📍 {poi.vicinity}
              </p>
            )}
          </div>

          {/* Description / review snippet */}
          {(isLoadingDetails || details?.description || details?.reviewSnippet) && (
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              {isLoadingDetails ? (
                <div className="flex flex-col gap-1.5">
                  <div className="skeleton h-2.5 rounded w-full" />
                  <div className="skeleton h-2.5 rounded w-11/12" />
                  <div className="skeleton h-2.5 rounded w-4/5" />
                  <div className="skeleton h-2.5 rounded w-9/12 mt-0.5" />
                </div>
              ) : (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {details?.description ?? details?.reviewSnippet}
                  {!details?.description && details?.reviewSnippet && (
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}> — via Google review</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Opening hours accordion */}
          {details?.weekdayText && details.weekdayText.length > 0 && (
            <div style={{ borderBottom: "1px solid var(--border)" }}>
              <button
                onClick={() => setHoursOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-3"
              >
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
                >
                  Opening Hours
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    color: "var(--muted)",
                    transform: hoursOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {hoursOpen && (
                <div className="px-5 pb-3 flex flex-col gap-0.5">
                  {details.weekdayText.map((line, i) => {
                    const colonIdx = line.indexOf(": ");
                    const day = colonIdx > -1 ? line.slice(0, colonIdx) : line;
                    const hours = colonIdx > -1 ? line.slice(colonIdx + 2) : "";
                    return (
                      <div key={i} className="flex justify-between items-baseline py-0.5">
                        <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)", minWidth: "90px" }}>
                          {day}
                        </span>
                        <span className="text-xs text-right" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
                          {hours}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="px-4 py-4 flex flex-col gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <button
              onClick={() => (isShortlisted ? onRemove(poi.placeId) : onAdd(poi))}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: isShortlisted ? "rgba(255,45,120,0.12)" : "var(--accent-dim)",
                border: `1px solid ${isShortlisted ? "var(--accent-secondary)" : "var(--accent)"}`,
                color: isShortlisted ? "var(--accent-secondary)" : "var(--accent)",
                fontFamily: "var(--font-dm-sans)",
                boxShadow: isShortlisted ? "0 0 14px rgba(255,45,120,0.15)" : "0 0 14px rgba(0,240,255,0.1)",
              }}
            >
              {isShortlisted ? "✓  Added to List" : "+  Add to List"}
            </button>

            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination_place_id=${poi.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-dm-sans)",
                  textDecoration: "none",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)", flexShrink: 0 }}>
                  <path d="M3 12l18-9-9 18-2-8-7-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Directions
              </a>

              <button
                onClick={handleShare}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)", flexShrink: 0 }}>
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {shareLabel}
              </button>

              <a
                href={`https://www.google.com/maps/place/?q=place_id:${poi.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-dm-sans)",
                  textDecoration: "none",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)", flexShrink: 0 }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Maps
              </a>
            </div>
          </div>

          {/* GetYourGuide widget */}
          {cityName && (
            <GygWidgetSection
              poiId={poi.placeId}
              poiName={poi.name}
              poiCategory={poi.category}
              cityName={cityName}
            />
          )}

          <div style={{ height: "24px" }} />
        </div>
      </div>
    </div>
  );
}
