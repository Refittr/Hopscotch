"use client";

import CitySearch from "./CitySearch";
import BrowseSection from "./BrowseSection";
import type { SelectedCity } from "@/app/page";
import type { POI } from "@/types/poi";

const VIBES = [
  { label: "Historical", emoji: "🏛️" },
  { label: "Food & Drink", emoji: "🍷" },
  { label: "Nightlife", emoji: "🌙" },
  { label: "Culture", emoji: "🎭" },
  { label: "Outdoors", emoji: "🌿" },
  { label: "Family", emoji: "🎠" },
];

interface Props {
  hideHeader?: boolean;
  selectedCity: SelectedCity | null;
  onCitySelect: (city: SelectedCity | null) => void;
  filteredPois: POI[];
  isLoading: boolean;
  activeVibes: Set<string>;
  onVibeToggle: (label: string) => void;
  highlightedPoiId: string | null;
}

export default function Sidebar({
  hideHeader,
  selectedCity,
  onCitySelect,
  filteredPois,
  isLoading,
  activeVibes,
  onVibeToggle,
  highlightedPoiId,
}: Props) {
  return (
    <aside
      className="sidebar flex flex-col h-full"
      style={{
        width: hideHeader ? "100%" : "400px",
        minWidth: hideHeader ? undefined : "400px",
        background: "var(--sidebar-bg)",
        borderRight: hideHeader ? "none" : "1px solid var(--border)",
      }}
    >
      {/* Brand Header */}
      {!hideHeader && (
        <div
          className="px-6 pt-7 pb-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h1
            className="text-4xl leading-none"
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontStyle: "italic",
              color: "var(--foreground)",
              letterSpacing: "-0.01em",
            }}
          >
            Hopscotch
          </h1>
          <p
            className="mt-1.5 text-xs font-medium"
            style={{
              color: "var(--accent)",
              letterSpacing: "0.18em",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            CITY EXPLORER
          </p>
        </div>
      )}

      {/* Search */}
      <div className="px-5 pt-5 pb-4">
        <CitySearch selectedCity={selectedCity} onCitySelect={onCitySelect} />
      </div>

      {/* Vibe Filter Chips */}
      <div className="px-5 pb-5">
        <div className="flex flex-wrap gap-2">
          {VIBES.map(({ label, emoji }) => {
            const isActive = activeVibes.has(label);
            return (
              <button
                key={label}
                onClick={() => onVibeToggle(label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: isActive ? "var(--chip-active-bg)" : "var(--chip-bg)",
                  border: isActive
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  color: isActive ? "var(--accent)" : "var(--muted)",
                  fontFamily: "var(--font-dm-sans)",
                  letterSpacing: "0.01em",
                }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)", margin: "0 20px" }} />

      {/* My List Section */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
          >
            My List
          </span>
          <span
            className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold"
            style={{
              background: "var(--border)",
              color: "var(--muted)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            0
          </span>
        </div>
        <p
          className="text-xs py-4 text-center rounded-lg"
          style={{
            color: "var(--muted)",
            background: "var(--input-bg)",
            border: "1px dashed var(--border)",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Add spots to build your route
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)", margin: "0 20px" }} />

      {/* Browse — scrollable, fills remaining space */}
      <BrowseSection
        pois={filteredPois}
        isLoading={isLoading}
        highlightedPoiId={highlightedPoiId}
        hasCity={selectedCity != null}
      />

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          disabled
          className="w-full py-3.5 rounded-xl text-sm font-semibold cursor-not-allowed"
          style={{
            background: "var(--border)",
            color: "var(--muted)",
            fontFamily: "var(--font-dm-sans)",
            letterSpacing: "0.04em",
          }}
        >
          Start Route
        </button>
      </div>
    </aside>
  );
}
