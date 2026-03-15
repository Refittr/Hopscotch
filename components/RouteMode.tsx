"use client";

import { useState } from "react";
import type { RouteState, HopOption, AISuggestion } from "@/types/route";
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
  onStartOver: () => void;
  onBackToPlanning: () => void;
  onHopHover: (placeId: string | null) => void;
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
  onSelect,
  onHover,
}: {
  option: HopOption;
  onSelect: () => void;
  onHover: (placeId: string | null) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => { setHover(true); onHover(option.poi.placeId); }}
      onMouseLeave={() => { setHover(false); onHover(null); }}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
      style={{
        background: hover ? "rgba(255,45,120,0.06)" : "var(--input-bg)",
        border: `1px solid ${hover ? "#FF2D78" : "var(--border)"}`,
        boxShadow: hover ? "0 0 12px rgba(255,45,120,0.12)" : "none",
        transition: "all 0.15s ease",
      }}
    >
      {/* Number badge */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ background: "#FF2D78", color: "#fff", ...MONO }}
      >
        {option.optionIndex}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--foreground)", ...MONO }}
        >
          {option.poi.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span style={{ ...LABEL, fontSize: "11px", letterSpacing: "0.08em" }}>
            {getCategoryEmoji(option.poi.category)} {option.poi.category}
          </span>
        </div>
      </div>

      {/* Distance / time */}
      <div className="text-right flex-shrink-0">
        <p
          className="text-xs font-semibold"
          style={{ color: "var(--accent)", ...MONO }}
        >
          ~{option.walkMinutes} min
        </p>
        <p className="text-xs" style={{ color: "var(--muted)", ...MONO }}>
          {option.directionHint}
        </p>
      </div>

      {/* Arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ color: hover ? "#FF2D78" : "var(--muted)", flexShrink: 0 }}
      >
        <path
          d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function AISuggestionCard({
  suggestion,
  loading,
  onAdd,
}: {
  suggestion: AISuggestion | null;
  loading: boolean;
  onAdd: (name: string) => void;
}) {
  if (!loading && !suggestion) return null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: "1.5px dashed #FF2D78",
        background: "rgba(255,45,120,0.07)",
        boxShadow: "0 0 18px rgba(255,45,120,0.1)",
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
            onClick={() => onAdd(suggestion.name)}
            className="w-full py-2 text-sm font-semibold rounded-lg transition-all"
            style={{
              background: "rgba(255,45,120,0.15)",
              border: "1px solid #FF2D78",
              color: "#FF2D78",
              ...MONO,
              boxShadow: "0 0 10px rgba(255,45,120,0.12)",
            }}
          >
            + Add to my list
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

function PickingStartView({
  shortlist,
  onPickStart,
}: {
  shortlist: POI[];
  onPickStart: Props["onPickStart"];
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

      {shortlist.map((poi) => (
        <button
          key={poi.placeId}
          onClick={() => onPickStart(poi)}
          className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all w-full group"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.background = "var(--input-bg)";
          }}
        >
          <span style={{ fontSize: "18px" }}>{getCategoryEmoji(poi.category)}</span>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--foreground)", ...MONO }}
            >
              {poi.name}
            </p>
            <p style={{ ...LABEL, fontSize: "10px" }}>{poi.category}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function HoppingView({
  state,
  onHopSelect,
  onAddAISuggestion,
  onUndoLastHop,
  onHopHover,
}: {
  state: Extract<RouteState, { phase: "hopping" }>;
  onHopSelect: (o: HopOption) => void;
  onAddAISuggestion: (name: string) => void;
  onUndoLastHop: () => void;
  onHopHover: (placeId: string | null) => void;
}) {
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
                onSelect={() => onHopSelect(opt)}
                onHover={onHopHover}
              />
            ))}
          </div>
        </>
      )}

      {/* AI suggestion */}
      <AISuggestionCard
        suggestion={state.aiSuggestion}
        loading={state.aiLoading}
        onAdd={onAddAISuggestion}
      />
    </div>
  );
}

function CompleteView({
  state,
  onStartOver,
  onBackToPlanning,
}: {
  state: Extract<RouteState, { phase: "complete" }>;
  onStartOver: () => void;
  onBackToPlanning: () => void;
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
  onStartOver,
  onBackToPlanning,
  onHopHover,
}: Props) {
  const cityName =
    routeState.phase !== "picking_start" ? routeState.cityName : null;

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: "420px",
        minWidth: "420px",
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
      <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
        {routeState.phase === "picking_start" && (
          <PickingStartView shortlist={shortlist} onPickStart={onPickStart} />
        )}
        {routeState.phase === "hopping" && (
          <HoppingView
            state={routeState}
            onHopSelect={onHopSelect}
            onAddAISuggestion={onAddAISuggestion}
            onUndoLastHop={onUndoLastHop}
            onHopHover={onHopHover}
          />
        )}
        {routeState.phase === "complete" && (
          <CompleteView
            state={routeState}
            onStartOver={onStartOver}
            onBackToPlanning={onBackToPlanning}
          />
        )}
      </div>
    </aside>
  );
}
