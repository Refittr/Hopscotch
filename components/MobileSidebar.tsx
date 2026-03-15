"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
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
}

export default function MobileSidebar(props: Props) {
  const [expanded, setExpanded] = useState(false);

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
          height: expanded ? "85vh" : "72px",
        }}
      >
        {/* Handle bar */}
        <button
          className="flex items-center justify-between px-5 py-4 w-full flex-shrink-0"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xl"
              style={{
                fontFamily: "var(--font-instrument-serif)",
                fontStyle: "italic",
                color: "var(--foreground)",
              }}
            >
              Hopscotch
            </span>
            <span
              className="text-xs font-medium"
              style={{
                color: "var(--accent)",
                letterSpacing: "0.15em",
                fontFamily: "var(--font-dm-sans)",
              }}
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
          <div className="flex-1 overflow-hidden">
            <Sidebar {...props} hideHeader />
          </div>
        )}
      </div>
    </div>
  );
}
