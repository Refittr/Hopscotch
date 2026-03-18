"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import BrowsePanel from "./BrowsePanel";
import HelpModal from "./HelpModal";
import ContactModal from "./ContactModal";
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
  nearMe: boolean;
  onNearMeToggle: () => void;
  userLocation: { lat: number; lng: number } | null;
  onPoiClick?: (poi: POI) => void;
  cityName?: string;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
}

export default function MobileSidebar(props: Props) {
  const {
    expanded, onExpandedChange,
    filteredPois, isLoading, selectedCity,
    shortlistIds, onAddToShortlist, onRemoveFromShortlist,
    onHighlight, nearMe, onNearMeToggle, userLocation, onPoiClick, cityName,
  } = props;

  const [tab, setTab] = useState<"controls" | "browse">("controls");
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Refs for stale-closure-free handlers
  const expandedRef = useRef(expanded);
  const detailOpenRef = useRef(detailOpen);
  useEffect(() => { expandedRef.current = expanded; }, [expanded]);
  useEffect(() => { detailOpenRef.current = detailOpen; }, [detailOpen]);

  // Push history state when sheet expands
  const didPushRef = useRef(false);
  useEffect(() => {
    if (expanded && !didPushRef.current) {
      history.pushState({ hopspot: "sheet" }, "");
      didPushRef.current = true;
    } else if (!expanded) {
      didPushRef.current = false;
    }
  }, [expanded]);

  // Back button: collapse sheet (only if detail card is not handling it)
  useEffect(() => {
    const handler = () => {
      if (expandedRef.current && !detailOpenRef.current) {
        onExpandedChange(false);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [onExpandedChange]);

  const toggle = () => {
    if (!expanded) {
      if (filteredPois.length > 0) setTab("browse");
      onExpandedChange(true);
    } else {
      onExpandedChange(false);
    }
  };

  return (
    <>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      <div
        className="flex flex-col h-full"
        style={{
          background: "var(--sidebar-bg)",
          borderTop: "1px solid var(--border)",
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
        }}
      >
        {/* ── Handle ── */}
        <div className="flex-shrink-0">
          {/* Centered expand/collapse arrow pill */}
          <div className="flex items-center justify-center" style={{ paddingTop: "10px", paddingBottom: "6px" }}>
            <button
              onClick={toggle}
              style={{
                background: "var(--accent-dim)",
                border: "1px solid rgba(0,240,255,0.35)",
                boxShadow: "0 0 18px rgba(0,240,255,0.3)",
                borderRadius: "999px",
                padding: "7px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "manipulation",
              }}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  color: "var(--accent)",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 300ms ease-out",
                }}
              >
                <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Info bar */}
          <div
            className="flex items-center px-4 w-full"
            style={{ paddingBottom: "10px" }}
          >
            <button
              className="flex items-center gap-2 min-w-0 flex-1"
              style={{ touchAction: "manipulation" }}
              onClick={() => { if (!expanded) toggle(); }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--accent)", flexShrink: 0, textShadow: "0 0 16px rgba(0,240,255,0.3)" }}>
                Hopspot
              </span>
              {selectedCity ? (
                <span className="text-xs font-medium truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}>
                  {selectedCity.name}
                  {!isLoading && filteredPois.length > 0 && (
                    <span style={{ color: "var(--muted)" }}> · {filteredPois.length}</span>
                  )}
                  {isLoading && <span style={{ color: "var(--muted)" }}> · loading…</span>}
                </span>
              ) : (
                <span className="text-xs font-medium" style={{ color: "var(--muted)", letterSpacing: "0.15em", fontFamily: "var(--font-dm-sans)" }}>
                  CITY EXPLORER
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowContact(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--border)", color: "var(--muted)" }}
                aria-label="Contact"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--border)", color: "var(--muted)" }}
                title="Reset"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--border)", color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
              >
                ?
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-shrink-0 gap-2 mx-4 mb-2">
          <button
            onClick={() => setTab("browse")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all"
            style={{
              background: tab === "browse" ? "var(--accent-dim)" : "var(--input-bg)",
              border: tab === "browse" ? "1px solid var(--accent)" : "1px solid var(--border)",
              boxShadow: tab === "browse" ? "0 0 12px rgba(0,240,255,0.15)" : "none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: tab === "browse" ? "var(--accent)" : "var(--muted)", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: tab === "browse" ? "var(--accent)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
              Browse
            </span>
            {!isLoading && filteredPois.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: tab === "browse" ? "rgba(0,240,255,0.15)" : "var(--border)", color: tab === "browse" ? "var(--accent)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                {filteredPois.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("controls")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all"
            style={{
              background: tab === "controls" ? "rgba(255,45,120,0.1)" : "var(--input-bg)",
              border: tab === "controls" ? "1px solid var(--accent-secondary)" : "1px solid var(--border)",
              boxShadow: tab === "controls" ? "0 0 12px rgba(255,45,120,0.15)" : "none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ color: tab === "controls" ? "var(--accent-secondary)" : "var(--muted)", flexShrink: 0 }}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: tab === "controls" ? "var(--accent-secondary)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
              My List
            </span>
            {props.shortlist.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: tab === "controls" ? "rgba(255,45,120,0.2)" : "var(--border)", color: tab === "controls" ? "var(--accent-secondary)" : "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
                {props.shortlist.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {tab === "controls" ? (
            <>
              <Sidebar {...props} hideHeader scrollable onBrowse={() => { setTab("browse"); if (!expanded) onExpandedChange(true); }} />
              <div className="px-4 pt-2 pb-2 flex-shrink-0">
                <AdUnit slot="2261277039" format="horizontal" />
              </div>
              <div style={{ height: "24px", flexShrink: 0 }} />
            </>
          ) : (
            <BrowsePanel
              pois={filteredPois}
              isLoading={isLoading}
              highlightedPoiId={props.highlightedPoiId}
              hasCity={selectedCity != null}
              shortlistIds={shortlistIds}
              onAddToShortlist={onAddToShortlist}
              onRemoveFromShortlist={onRemoveFromShortlist}
              onHighlight={onHighlight}
              fullWidth
              nearMe={nearMe}
              onNearMeToggle={onNearMeToggle}
              userLocation={userLocation}
              onPoiClick={onPoiClick}
              cityName={cityName ?? selectedCity?.name}
              onDetailStateChange={setDetailOpen}
            />
          )}
        </div>
      </div>
    </>
  );
}
