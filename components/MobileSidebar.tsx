"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import BrowsePanel from "./BrowsePanel";
import HelpModal from "./HelpModal";
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
  const [showHelp, setShowHelp] = useState(false);

  const {
    filteredPois,
    isLoading,
    highlightedPoiId,
    selectedCity,
    shortlistIds,
    onAddToShortlist,
  } = props;

  return (
    <>
    {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    <div className="md:hidden absolute inset-x-0 bottom-0 z-50" style={{ pointerEvents: "none" }}>
      {expanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ pointerEvents: "auto" }}
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className="relative flex flex-col transition-all duration-300 ease-out rounded-t-2xl overflow-hidden"
        style={{
          background: "var(--sidebar-bg)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          height: expanded ? "92vh" : "50vh",
          pointerEvents: "auto",
        }}
      >
        {/* Handle bar */}
        <button
          className="flex items-center justify-between px-5 w-full flex-shrink-0"
          style={{ touchAction: "manipulation", paddingTop: "18px", paddingBottom: "16px" }}
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
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
            <button
              onClick={(e) => { e.stopPropagation(); setShowHelp(true); }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "var(--border)",
                color: "var(--muted)",
                fontFamily: "var(--font-dm-sans)",
                flexShrink: 0,
              }}
            >
              ?
            </button>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "var(--border)",
              transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ color: "var(--muted)" }}>
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {/* Always-visible content when collapsed */}
        {!expanded && (
          <div
            className="flex-1 min-h-0 px-4"
            style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" as never, touchAction: "pan-y", paddingBottom: "24px" }}
          >
            <Sidebar {...props} hideHeader scrollable />
          </div>
        )}

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
                  onHighlight={() => {}}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
