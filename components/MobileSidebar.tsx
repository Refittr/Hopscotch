"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import BrowsePanel from "./BrowsePanel";
import type { SelectedCity } from "@/app/page";
import type { POI } from "@/types/poi";

interface Props {
  selectedCity: SelectedCity | null;
  onCitySelect: (city: SelectedCity | null) => void;
  filteredPois: POI[];
  isLoading: boolean;
  activeVibes: Set<string>;
  onVibeToggle: (label: string) => void;
  highlightedPoiId: string | null;
  shortlist: POI[];
  shortlistIds: Set<string>;
  onAddToShortlist: (poi: POI) => void;
  onRemoveFromShortlist: (placeId: string) => void;
  onReorderShortlist: (newList: POI[]) => void;
  onStartRoute: () => void;
}

export default function MobileSidebar(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"controls" | "browse">("controls");

  const {
    filteredPois,
    isLoading,
    highlightedPoiId,
    selectedCity,
    shortlistIds,
    onAddToShortlist,
  } = props;

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50">
      {expanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className="relative flex flex-col transition-all duration-300 ease-out rounded-t-2xl overflow-hidden"
        style={{
          background: "var(--sidebar-bg)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          height: expanded ? "85vh" : "64px",
        }}
      >
        {/* Handle bar */}
        <button
          className="flex items-center justify-between px-5 py-4 w-full flex-shrink-0"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                color: "var(--accent)",
                textShadow: "0 0 16px rgba(0,240,255,0.3)",
              }}
            >
              Hopscotch
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--muted)", letterSpacing: "0.2em", fontFamily: "var(--font-dm-sans)" }}
            >
              CITY EXPLORER
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "var(--border)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--muted)" }}>
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {expanded && (
          <>
            {/* Tab switcher */}
            <div
              className="flex flex-shrink-0 mx-4 mb-3 rounded-lg overflow-hidden"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}
            >
              {(["controls", "browse"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-2 text-xs font-medium capitalize transition-all"
                  style={{
                    background: tab === t ? "var(--accent-dim)" : "transparent",
                    color: tab === t ? "var(--accent)" : "var(--muted)",
                    borderBottom: tab === t ? "1px solid var(--accent)" : "1px solid transparent",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {t === "controls" ? "My List" : "Browse"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {tab === "controls" ? (
                <Sidebar {...props} hideHeader />
              ) : (
                <BrowsePanel
                  pois={filteredPois}
                  isLoading={isLoading}
                  highlightedPoiId={highlightedPoiId}
                  hasCity={selectedCity != null}
                  shortlistIds={shortlistIds}
                  onAddToShortlist={onAddToShortlist}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
