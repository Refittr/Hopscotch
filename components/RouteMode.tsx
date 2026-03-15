"use client";

import { useState } from "react";
import type { RouteState, HopOption, AISuggestion, CompletedHop } from "@/types/route";
import type { POI } from "@/types/poi";
import { formatWalkTime, formatDistanceKm } from "@/lib/routeUtils";
import { getCategoryEmoji } from "@/lib/placesCategories";

interface Props {
  routeState: RouteState;
  shortlist: POI[];
  browsePOIs: POI[];
  onPickStart: (start: POI | { lat: number; lng: number; name: string; isGeolocation: true }) => void;
  onHopSelect: (option: HopOption) => void;
  onAddAISuggestion: (name: string) => void;
  onUndoLastHop: () => void;
  onRemoveFromRoute: (placeId: string) => void;
  onFinishRoute: () => void;
  onStartOver: () => void;
  onBackToPlanning: () => void;
  onSpotHover: (placeId: string | null) => void;
  onSuggestionHover: (hovering: boolean) => void;
  onToast: (msg: string) => void;
}

// ── Shared styles ────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const MONO: React.CSSProperties = { fontFamily: "var(--font-dm-sans)" };

// ── Sub-components ───────────────────────────────────────────────────────────

function InfoTooltip({ poi }: { poi: POI }) {
  const [show, setShow] = useState(false);
  const usefulTypes = poi.types
    .filter((t) => !["point_of_interest", "establishment", "food", "premise"].includes(t))
    .slice(0, 3)
    .map((t) => t.replace(/_/g, " "));

  return (
    <div className="relative flex-shrink-0" style={{ zIndex: 20 }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => e.stopPropagation()}
        className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
        style={{
          background: show ? "rgba(0,240,255,0.15)" : "var(--border)",
          color: show ? "var(--accent)" : "var(--muted)",
          fontSize: "10px",
          fontWeight: 700,
          fontFamily: "var(--font-dm-sans)",
          border: `1px solid ${show ? "rgba(0,240,255,0.3)" : "transparent"}`,
        }}
      >
        i
      </button>
      {show && (
        <div
          className="absolute right-0 bottom-full mb-2 rounded-xl p-3 pointer-events-none"
          style={{
            background: "#1c1a21",
            border: "1px solid var(--border)",
            width: "210px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--foreground)", ...MONO }}>
            {poi.name}
          </p>
          {poi.rating != null && (
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ color: "#f4c430", fontSize: "12px" }}>★</span>
              <span className="text-xs font-semibold" style={{ color: "var(--foreground)", ...MONO }}>
                {poi.rating.toFixed(1)}
              </span>
              {poi.ratingsCount != null && (
                <span className="text-xs" style={{ color: "var(--muted)", ...MONO }}>
                  ({poi.ratingsCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {poi.isOpen != null && (
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: poi.isOpen ? "#22c55e" : "#FF2D78" }}
              />
              <span className="text-xs" style={{ color: poi.isOpen ? "#22c55e" : "#FF2D78", ...MONO }}>
                {poi.isOpen ? "Open now" : "Closed"}
              </span>
            </div>
          )}
          {usefulTypes.length > 0 && (
            <p className="text-xs" style={{ color: "var(--muted)", ...MONO, lineHeight: 1.4 }}>
              {usefulTypes.join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 mb-3"
      style={{ ...LABEL, color: "var(--muted)" }}
    >
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      <span>{children}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

function HopOptionCard({
  option,
  selected,
  onSelect,
  onSpotHover,
  onRemove,
}: {
  option: HopOption;
  selected?: boolean;
  onSelect: () => void;
  onSpotHover: (placeId: string | null) => void;
  onRemove: (placeId: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const active = hover || selected;
  return (
    <div
      className="flex items-stretch rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${active ? "#FF2D78" : "var(--border)"}`,
        boxShadow: active ? "0 0 12px rgba(255,45,120,0.12)" : "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={() => { setHover(true); onSpotHover(option.poi.placeId); }}
      onMouseLeave={() => { setHover(false); onSpotHover(null); }}
    >
      {/* Main select button */}
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-3 p-3 text-left transition-all"
        style={{ background: active ? "rgba(255,45,120,0.06)" : "var(--input-bg)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ background: "#FF2D78", color: "#fff", ...MONO }}
        >
          {option.optionIndex}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)", ...MONO }}>
            {option.poi.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span style={{ ...LABEL, fontSize: "11px", letterSpacing: "0.08em" }}>
              {getCategoryEmoji(option.poi.category)} {option.poi.category}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-semibold" style={{ color: "var(--accent)", ...MONO }}>
            ~{option.walkMinutes} min
          </p>
          <p className="text-xs" style={{ color: "var(--muted)", ...MONO }}>
            {option.directionHint}
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ color: hover ? "#FF2D78" : "var(--muted)", flexShrink: 0 }}>
          <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Info tooltip */}
      <div className="flex items-center px-1.5" style={{ background: active ? "rgba(255,45,120,0.06)" : "var(--input-bg)", transition: "background 0.15s ease" }}>
        <InfoTooltip poi={option.poi} />
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(option.poi.placeId)}
        className="flex items-center justify-center px-2.5 transition-all flex-shrink-0"
        style={{
          background: active ? "rgba(255,45,120,0.06)" : "var(--input-bg)",
          borderLeft: `1px solid ${active ? "rgba(255,45,120,0.3)" : "var(--border)"}`,
          color: "var(--muted)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FF2D78"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
        title="Remove from route"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function AISuggestionCard({
  suggestion,
  loading,
  onAdd,
  onHover,
}: {
  suggestion: AISuggestion | null;
  loading: boolean;
  onAdd: (name: string) => void;
  onHover: (hovering: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  if (!loading && !suggestion) return null;

  return (
    <div
      className="rounded-xl p-4 transition-all cursor-default"
      onMouseEnter={() => { setHover(true); onHover(true); }}
      onMouseLeave={() => { setHover(false); onHover(false); }}
      style={{
        border: `1.5px dashed ${hover ? "#FF2D78" : "rgba(255,45,120,0.6)"}`,
        background: hover ? "rgba(255,45,120,0.1)" : "rgba(255,45,120,0.07)",
        boxShadow: hover ? "0 0 24px rgba(255,45,120,0.18)" : "0 0 18px rgba(255,45,120,0.1)",
        transition: "all 0.15s ease",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: "15px" }}>✨</span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            color: "#FF2D78",
          }}
        >
          On the way
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,45,120,0.3)" }} />
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0.7, 0.9, 0.5].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded ai-skeleton"
              style={{ width: `${w * 100}%` }}
            />
          ))}
          <p className="text-xs mt-1" style={{ color: "rgba(255,45,120,0.5)", ...MONO }}>
            Finding something nearby…
          </p>
        </div>
      )}

      {!loading && suggestion && (
        <>
          <p
            className="text-base font-semibold mb-1"
            style={{ color: "var(--foreground)", ...MONO }}
          >
            {suggestion.name}
          </p>
          <p
            className="text-xs mb-3"
            style={{ color: "var(--muted)", ...MONO, lineHeight: 1.5 }}
          >
            Near <span style={{ color: "var(--foreground)" }}>{suggestion.nearOption}</span> — {suggestion.reason}
          </p>
          <button
            onClick={() => { onAdd(suggestion.name); onHover(false); }}
            className="w-full py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: "rgba(255,45,120,0.15)",
              border: "1px solid #FF2D78",
              color: "#FF2D78",
              ...MONO,
              boxShadow: "0 0 10px rgba(255,45,120,0.12)",
            }}
          >
            + Add to route
          </button>
        </>
      )}
    </div>
  );
}

type TimelineHop = { from: { name: string }; to: POI; walkMinutes: number; distanceKm: number };

function CompletedTimeline({ hops }: { hops: TimelineHop[] }) {
  if (hops.length === 0) return null;
  return (
    <div className="mb-4">
      <SectionLabel>Completed</SectionLabel>
      <div className="flex flex-col">
        {hops.map((hop, i) => (
          <div key={i} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{
                  background: "var(--border)",
                  color: "var(--muted)",
                  border: "1px solid var(--muted)",
                  ...MONO,
                }}
              >
                ✓
              </div>
              {i < hops.length - 1 && (
                <div
                  className="w-px flex-1 my-1"
                  style={{ background: "var(--border)", minHeight: "24px" }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-3 flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--muted)", ...MONO }}
              >
                {hop.to.name}
              </p>
              <p className="text-xs" style={{ color: "var(--border)", ...MONO }}>
                {formatWalkTime(hop.walkMinutes)} · {formatDistanceKm(hop.distanceKm)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Phase views ──────────────────────────────────────────────────────────────

function PickSpotRow({
  poi,
  index,
  onPickStart,
  onRemove,
  onHover,
}: {
  poi: POI;
  index: number;
  onPickStart: Props["onPickStart"];
  onRemove: (placeId: string) => void;
  onHover: (placeId: string | null) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="flex items-stretch rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${hover ? "var(--accent)" : "var(--border)"}`,
        boxShadow: hover ? "0 0 10px rgba(0,240,255,0.08)" : "none",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={() => { setHover(true); onHover(poi.placeId); }}
      onMouseLeave={() => { setHover(false); onHover(null); }}
    >
      <button
        onClick={() => onPickStart(poi)}
        className="flex-1 flex items-center gap-2.5 p-3 text-left transition-all"
        style={{ background: hover ? "var(--accent-dim)" : "var(--input-bg)" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: hover ? "var(--accent)" : "var(--border)", color: hover ? "#0a0a0a" : "var(--muted)", ...MONO, transition: "all 0.15s ease" }}
        >
          {index}
        </div>
        <span style={{ fontSize: "16px" }}>{getCategoryEmoji(poi.category)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)", ...MONO }}>
            {poi.name}
          </p>
          <p style={{ ...LABEL, fontSize: "10px" }}>{poi.category}</p>
        </div>
      </button>

      {/* Info tooltip */}
      <div className="flex items-center px-2" style={{ background: hover ? "var(--accent-dim)" : "var(--input-bg)", transition: "background 0.15s ease" }}>
        <InfoTooltip poi={poi} />
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(poi.placeId)}
        className="flex items-center justify-center px-2.5 flex-shrink-0 transition-all"
        style={{
          background: hover ? "var(--accent-dim)" : "var(--input-bg)",
          borderLeft: `1px solid ${hover ? "rgba(0,240,255,0.2)" : "var(--border)"}`,
          color: "var(--muted)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FF2D78"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
        title="Remove from list"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function PickingStartView({
  shortlist,
  onPickStart,
  onRemoveFromRoute,
  onSpotHover,
}: {
  shortlist: POI[];
  onPickStart: Props["onPickStart"];
  onRemoveFromRoute: (placeId: string) => void;
  onSpotHover: (placeId: string | null) => void;
}) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setGeoLoading(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPickStart({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "Your location",
          isGeolocation: true,
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError(true);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-xs"
        style={{ color: "var(--muted)", ...MONO, lineHeight: 1.5 }}
      >
        Where are you starting from?
      </p>

      {/* Geolocation option */}
      <button
        onClick={handleGeolocation}
        disabled={geoLoading}
        className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all w-full"
        style={{
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          opacity: geoLoading ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: "16px" }}>{geoLoading ? "⏳" : "📍"}</span>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--accent)", ...MONO }}
        >
          {geoLoading ? "Getting location…" : "Use my current location"}
        </span>
      </button>

      {geoError && (
        <p className="text-xs" style={{ color: "#FF2D78", ...MONO }}>
          Location access denied — pick a spot below instead.
        </p>
      )}

      <SectionLabel>Or start from a spot</SectionLabel>

      {shortlist.map((poi, i) => (
        <PickSpotRow
          key={poi.placeId}
          poi={poi}
          index={i + 1}
          onPickStart={onPickStart}
          onRemove={onRemoveFromRoute}
          onHover={onSpotHover}
        />
      ))}
    </div>
  );
}

function HoppingView({
  state,
  onHopSelect,
  onAddAISuggestion,
  onUndoLastHop,
  onRemoveFromRoute,
  onFinishRoute,
  onSpotHover,
  onSuggestionHover,
}: {
  state: Extract<RouteState, { phase: "hopping" }>;
  onHopSelect: (o: HopOption) => void;
  onAddAISuggestion: (name: string) => void;
  onUndoLastHop: () => void;
  onRemoveFromRoute: (placeId: string) => void;
  onFinishRoute: () => void;
  onSpotHover: (placeId: string | null) => void;
  onSuggestionHover: (hovering: boolean) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingOption = state.hopOptions.find((o) => o.poi.placeId === pendingId) ?? null;

  const handleCardClick = (opt: HopOption) => {
    if (pendingId === opt.poi.placeId) {
      // second tap → confirm
      onHopSelect(opt);
      setPendingId(null);
    } else {
      // first tap → preview
      setPendingId(opt.poi.placeId);
      onSpotHover(opt.poi.placeId);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Completed timeline */}
      <CompletedTimeline hops={state.completedHops} />

      {/* Current position + undo */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 8px rgba(0,240,255,0.6)",
          }}
        />
        <p
          className="text-sm font-semibold truncate flex-1"
          style={{ color: "var(--accent)", ...MONO }}
        >
          {state.currentPosition.name}
        </p>
        {state.completedHops.length > 0 && (
          <button
            onClick={onUndoLastHop}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              ...MONO,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--muted)";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.color = "var(--muted)";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h7M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Undo
          </button>
        )}
      </div>

      {/* Next hop options */}
      {state.hopOptions.length > 0 && (
        <>
          <SectionLabel>Choose your next hop</SectionLabel>
          <div className="flex flex-col gap-2">
            {state.hopOptions.map((opt) => (
              <HopOptionCard
                key={opt.poi.placeId}
                option={opt}
                selected={pendingId === opt.poi.placeId}
                onSelect={() => handleCardClick(opt)}
                onSpotHover={onSpotHover}
                onRemove={(id) => { if (pendingId === id) setPendingId(null); onRemoveFromRoute(id); }}
              />
            ))}
          </div>
          {pendingOption && (
            <button
              onClick={() => { onHopSelect(pendingOption); setPendingId(null); }}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "#FF2D78",
                color: "#fff",
                ...MONO,
                letterSpacing: "0.04em",
                boxShadow: "0 0 20px rgba(255,45,120,0.35)",
              }}
            >
              Go to {pendingOption.poi.name} →
            </button>
          )}
        </>
      )}

      {/* AI suggestion */}
      <AISuggestionCard
        suggestion={state.aiSuggestion}
        loading={state.aiLoading}
        onAdd={onAddAISuggestion}
        onHover={onSuggestionHover}
      />

      {/* Finish early */}
      {state.completedHops.length > 0 && (
        <button
          onClick={onFinishRoute}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            fontFamily: "var(--font-dm-sans)",
            letterSpacing: "0.06em",
          }}
        >
          Finish Route
        </button>
      )}
    </div>
  );
}

// ── Share helpers ─────────────────────────────────────────────────────────────

function stopsFromHops(hops: CompletedHop[]) {
  if (hops.length === 0) return [];
  const stops = [
    { name: hops[0].from.name, lat: hops[0].from.lat, lng: hops[0].from.lng, order: 0 },
    ...hops.map((h, i) => ({
      name: h.to.name,
      lat: h.to.lat,
      lng: h.to.lng,
      order: i + 1,
      walkMinutes: h.walkMinutes,
      distanceKm: h.distanceKm,
    })),
  ];
  return stops;
}

function googleMapsUrl(stops: ReturnType<typeof stopsFromHops>): string {
  return (
    "https://www.google.com/maps/dir/" +
    stops.map((s) => `${s.lat},${s.lng}`).join("/") +
    "/?travelmode=walking"
  );
}

function copyText(hops: CompletedHop[], cityName: string): string {
  const lines: string[] = [`🗺 Hopscotch route — ${cityName}`];
  const stops = stopsFromHops(hops);
  stops.forEach((stop, i) => {
    lines.push(`${i + 1}. ${stop.name}${i === 0 ? " (start)" : ""}`);
    if (i < stops.length - 1 && hops[i]) {
      lines.push(`   ↓ ${hops[i].walkMinutes} min walk`);
    }
  });
  const total = hops.reduce((s, h) => s + h.walkMinutes, 0);
  lines.push(`Total: ~${total} min walking`);
  return lines.join("\n");
}

async function shareRoute(
  hops: CompletedHop[],
  cityName: string,
  onToast: (msg: string) => void
) {
  const stops = stopsFromHops(hops);
  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityName, stops }),
    });
    const { shortCode, error } = await res.json();
    if (error) throw new Error(error);
    const url = `${window.location.origin}/r/${shortCode}`;
    await navigator.clipboard.writeText(url);
    onToast("Link copied!");
  } catch {
    onToast("Could not create share link");
  }
}

// ── ShareButtons ──────────────────────────────────────────────────────────────

function ShareButtons({
  hops,
  cityName,
  onToast,
  compact = false,
}: {
  hops: CompletedHop[];
  cityName: string;
  onToast: (msg: string) => void;
  compact?: boolean;
}) {
  const stops = stopsFromHops(hops);
  const mapsUrl = googleMapsUrl(stops);

  const btnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: compact ? "0" : "6px",
    padding: compact ? "6px 8px" : "8px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--input-bg)",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: compact ? "11px" : "12px",
    fontFamily: "var(--font-dm-sans)",
    transition: "border-color 0.15s, color 0.15s",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
      {/* Share link */}
      <button
        title="Copy share link"
        style={btnStyle}
        onClick={() => shareRoute(hops, cityName, onToast)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLElement).style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--muted)";
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        {!compact && <span>Share link</span>}
      </button>

      {/* Google Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Google Maps"
        style={{ ...btnStyle, textDecoration: "none" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#4285F4";
          (e.currentTarget as HTMLElement).style.color = "#4285F4";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--muted)";
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
        {!compact && <span>Google Maps</span>}
      </a>

      {/* Copy text */}
      <button
        title="Copy route as text"
        style={btnStyle}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copyText(hops, cityName));
            onToast("Route copied!");
          } catch {
            onToast("Could not copy");
          }
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLElement).style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--muted)";
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        {!compact && <span>Copy list</span>}
      </button>
    </div>
  );
}

// ── CompleteView ───────────────────────────────────────────────────────────────

function CompleteView({
  state,
  onStartOver,
  onBackToPlanning,
  onToast,
}: {
  state: Extract<RouteState, { phase: "complete" }>;
  onStartOver: () => void;
  onBackToPlanning: () => void;
  onToast: (msg: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div
        className="flex flex-col items-center py-5 rounded-xl gap-2"
        style={{ background: "var(--accent-dim)", border: "1px solid var(--accent)" }}
      >
        <span style={{ fontSize: "28px" }}>🎉</span>
        <p
          className="text-base font-semibold"
          style={{ color: "var(--accent)", ...MONO }}
        >
          Route complete!
        </p>
        <p className="text-xs" style={{ color: "var(--muted)", ...MONO }}>
          {state.cityName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Total walk", value: formatWalkTime(state.totalWalkMinutes) },
          { label: "Distance", value: formatDistanceKm(state.totalDistanceKm) },
          { label: "Stops", value: `${state.completedHops.length}` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center py-3 rounded-lg"
            style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
          >
            <p
              className="text-lg font-bold"
              style={{ color: "var(--foreground)", ...MONO }}
            >
              {value}
            </p>
            <p style={{ ...LABEL }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Completed timeline */}
      <CompletedTimeline hops={state.completedHops} />

      {/* Share bar */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold" style={{ color: "var(--foreground)", ...MONO, letterSpacing: "0.1em" }}>
          SAVE &amp; SHARE
        </p>
        <ShareButtons hops={state.completedHops} cityName={state.cityName} onToast={onToast} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={onStartOver}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--accent)",
            color: "#0a0a0a",
            ...MONO,
            letterSpacing: "0.04em",
            boxShadow: "0 0 20px rgba(0,240,255,0.2)",
          }}
        >
          Start over
        </button>
        <button
          onClick={onBackToPlanning}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            ...MONO,
          }}
        >
          Back to planning
        </button>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function RouteMode({
  routeState,
  shortlist,
  onPickStart,
  onHopSelect,
  onAddAISuggestion,
  onUndoLastHop,
  onRemoveFromRoute,
  onFinishRoute,
  onStartOver,
  onBackToPlanning,
  onSpotHover,
  onSuggestionHover,
  onToast,
}: Props) {
  const cityName =
    routeState.phase !== "picking_start" ? routeState.cityName : null;

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Fixed top bar */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={onBackToPlanning}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)", ...MONO }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to planning
        </button>
        <div className="flex items-center gap-2">
          {cityName && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: "var(--accent)",
                background: "var(--accent-dim)",
                border: "1px solid rgba(0,240,255,0.2)",
                ...MONO,
              }}
            >
              {cityName}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              color: "var(--accent)",
              textShadow: "0 0 16px rgba(0,240,255,0.3)",
            }}
          >
            Hopscotch
          </span>
        </div>
      </div>

      {/* Phase heading */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--foreground)", ...MONO }}
        >
          {routeState.phase === "picking_start" && "Pick your start"}
          {routeState.phase === "hopping" && "Hop to it"}
          {routeState.phase === "complete" && "Route complete"}
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pt-1 min-h-0">
        {routeState.phase === "picking_start" && (
          <PickingStartView
            shortlist={shortlist}
            onPickStart={onPickStart}
            onRemoveFromRoute={onRemoveFromRoute}
            onSpotHover={onSpotHover}
          />
        )}
        {routeState.phase === "hopping" && (
          <HoppingView
            state={routeState}
            onHopSelect={onHopSelect}
            onAddAISuggestion={onAddAISuggestion}
            onUndoLastHop={onUndoLastHop}
            onRemoveFromRoute={onRemoveFromRoute}
            onFinishRoute={onFinishRoute}
            onSpotHover={onSpotHover}
            onSuggestionHover={onSuggestionHover}
          />
        )}
        {routeState.phase === "complete" && (
          <CompleteView
            state={routeState}
            onStartOver={onStartOver}
            onBackToPlanning={onBackToPlanning}
            onToast={onToast}
          />
        )}
        <div style={{ height: "40px" }} />
      </div>
    </aside>
  );
}
