"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import BrowsePanel from "./BrowsePanel";
import HelpModal from "./HelpModal";
import AdUnit from "./AdUnit";
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
  onHighlight: (placeId: string | null) => void;
}

export default function MobileSidebar(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState<"controls" | "browse">("controls");
  const [showHelp, setShowHelp] = useState(false);

  const { filteredPois, isLoading, highlightedPoiId, selectedCity, shortlistIds, onAddToShortlist, onRemoveFromShortlist, onStartRoute, onHighlight } = props;

  return (
    <>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Expanded: fills 62vh panel or fullscreen */}
      {expanded && (
        <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col" : "flex flex-col h-full"} style={{ background: "var(--sidebar-bg)" }}>
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 flex-shrink-0"
            style={{ paddingTop: "18px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--accent)", textShadow: "0 0 16px rgba(0,240,255,0.3)" }}>
                Hopscotch
              </span>
              <button
                onClick={() => setShowHelp(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--border)", color: "var(--muted)", fontFamily: "var(--font-dm-sans)", flexShrink: 0 }}
              >
                ?
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFullscreen(f => !f)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--border)" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)" }}>
                  {fullscreen
                    ? <path d="M8 3v5H3M21 8h-5V3M16 21v-5h5M3 16h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  }
                </svg>
              </button>
              <button
                onClick={() => { setExpanded(false); setFullscreen(false); }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--border)" }}
              >
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ color: "var(--muted)" }}>
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-shrink-0 gap-2 mx-4 mt-3 mb-2">
            <button
              onClick={() => setTab("browse")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              style={{
                background: tab === "browse" ? "var(--accent-dim)" : "var(--input-bg)",
                border: tab === "browse" ? "1px solid var(--accent)" : "1px solid var(--border)",
                boxShadow: tab === "browse" ? "0 0 12px rgba(0,240,255,0.15)" : "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: tab === "browse" ? "var(--accent)" : "var(--muted)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: tab === "browse" ? "var(--accent)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                Browse
              </span>
              {!isLoading && filteredPois.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                  background: tab === "browse" ? "rgba(0,240,255,0.15)" : "var(--border)",
                  color: tab === "browse" ? "var(--accent)" : "var(--muted)",
                  fontFamily: "var(--font-dm-sans)",
                }}>
                  {filteredPois.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab("controls")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              style={{
                background: tab === "controls" ? "rgba(255,45,120,0.1)" : "var(--input-bg)",
                border: tab === "controls" ? "1px solid var(--accent-secondary)" : "1px solid var(--border)",
                boxShadow: tab === "controls" ? "0 0 12px rgba(255,45,120,0.15)" : "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: tab === "controls" ? "var(--accent-secondary)" : "var(--muted)", flexShrink: 0 }}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: tab === "controls" ? "var(--accent-secondary)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                My List
              </span>
              {props.shortlist.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                  background: tab === "controls" ? "rgba(255,45,120,0.2)" : "var(--border)",
                  color: tab === "controls" ? "var(--accent-secondary)" : "var(--muted)",
                  fontFamily: "var(--font-dm-sans)",
                }}>
                  {props.shortlist.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {tab === "controls" ? (
              <Sidebar {...props} hideHeader onBrowse={() => setTab("browse")} />
            ) : (
              <BrowsePanel
                pois={filteredPois}
                isLoading={isLoading}
                highlightedPoiId={highlightedPoiId}
                hasCity={selectedCity != null}
                shortlistIds={shortlistIds}
                onAddToShortlist={onAddToShortlist}
                onRemoveFromShortlist={onRemoveFromShortlist}
                onHighlight={onHighlight}
                fullWidth
              />
            )}
          </div>
        </div>
      )}

      {/* Collapsed: plain in-flow panel, no absolute/fixed */}
      {!expanded && (
        <div className="flex flex-col h-full" style={{ background: "var(--sidebar-bg)", borderTop: "1px solid var(--border)" }}>
          {/* Handle bar */}
          <button
            className="flex items-center justify-between px-4 w-full flex-shrink-0"
            style={{ touchAction: "manipulation", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}
            onClick={() => {
              if (filteredPois.length > 0) setTab("browse");
              setExpanded(true);
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--accent)", flexShrink: 0, textShadow: "0 0 16px rgba(0,240,255,0.3)" }}>
                Hopscotch
              </span>
              {selectedCity ? (
                <span className="text-xs font-medium truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
                  {selectedCity.name}
                  {!isLoading && filteredPois.length > 0 && (
                    <span style={{ color: "var(--muted)" }}> · {filteredPois.length} spots</span>
                  )}
                  {isLoading && (
                    <span style={{ color: "var(--muted)" }}> · loading…</span>
                  )}
                </span>
              ) : (
                <span className="text-xs font-medium" style={{ color: "var(--muted)", letterSpacing: "0.2em", fontFamily: "var(--font-dm-sans)" }}>
                  CITY EXPLORER
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
              style={{
                background: selectedCity && !isLoading ? "var(--accent-dim)" : "var(--border)",
                border: selectedCity && !isLoading ? "1px solid var(--accent)" : "1px solid transparent",
                boxShadow: selectedCity && !isLoading ? "0 0 10px rgba(0,240,255,0.2)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: selectedCity && !isLoading ? "var(--accent)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
              >
                {selectedCity && !isLoading ? "Browse" : "Explore"}
              </span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: selectedCity && !isLoading ? "var(--accent)" : "var(--muted)" }}>
                <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 min-h-0">
            <Sidebar {...props} hideHeader scrollable onBrowse={() => { setTab("browse"); setExpanded(true); }} />
            <div className="pt-3 pb-2">
              <AdUnit slot="2261277039" format="horizontal" />
            </div>
            <div style={{ height: "16px", flexShrink: 0 }} />
          </div>
        </div>
      )}
    </>
  );
}
