"use client";

import { useEffect, useRef, useState } from "react";
import {
  Landmark, Palette, Utensils, Wine, ShoppingBag,
  Trees, Users, Music2, Sparkles, Gem, Rainbow, ChevronDown,
} from "lucide-react";
import CitySearch from "./CitySearch";
import MyListSection from "./MyListSection";
import HelpModal from "./HelpModal";
import ContactModal from "./ContactModal";
import type { SelectedCity } from "@/app/page";
import type { POI } from "@/types/poi";

const VIBES: { label: string; Icon: React.ElementType }[] = [
  { label: "Historical",                 Icon: Landmark  },
  { label: "Arts & Culture",             Icon: Palette   },
  { label: "Food",                       Icon: Utensils  },
  { label: "Drinks & Nightlife",         Icon: Wine      },
  { label: "Shopping",                   Icon: ShoppingBag },
  { label: "Outdoors",                   Icon: Trees     },
  { label: "Family",                     Icon: Users     },
  { label: "Live Music & Entertainment", Icon: Music2    },
  { label: "Wellness",                   Icon: Sparkles  },
  { label: "Hidden Gems",                Icon: Gem       },
  { label: "LGBT+",                      Icon: Rainbow   },
];

interface Props {
  hideHeader?: boolean;
  scrollable?: boolean;
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
  onBrowse?: () => void;
}

export default function Sidebar({
  hideHeader,
  scrollable,
  selectedCity,
  onCitySelect,
  activeVibes,
  onVibeToggle,
  shortlist,
  shortlistIds,
  onAddToShortlist,
  onRemoveFromShortlist,
  onReorderShortlist,
  onStartRoute,
  onBrowse,
}: Props) {
  const prevCountRef = useRef(0);
  const [badgePulsing, setBadgePulsing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [vibesOpen, setVibesOpen] = useState(true);

  useEffect(() => {
    if (shortlist.length > prevCountRef.current) {
      setBadgePulsing(true);
      const t = setTimeout(() => setBadgePulsing(false), 500);
      prevCountRef.current = shortlist.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = shortlist.length;
  }, [shortlist.length]);

  const canStartRoute = shortlist.length >= 2;
  return (
    <aside
      className={`flex flex-col flex-shrink-0 ${scrollable ? "" : "h-full"}`}
      style={{
        width: hideHeader ? "100%" : "280px",
        minWidth: hideHeader ? undefined : "280px",
        background: "var(--sidebar-bg)",
        borderRight: hideHeader ? "none" : "1px solid var(--border)",
      }}
    >
      {/* Brand Header */}
      {!hideHeader && (
        <div
          className="flex items-start justify-between px-5 pt-6 pb-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h1
              className="text-3xl leading-none"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--accent)",
                textShadow: "0 0 24px rgba(0, 240, 255, 0.35)",
              }}
            >
              Hopscotch
            </h1>
            <p
              className="mt-1.5 text-xs font-medium"
              style={{
                color: "var(--muted)",
                letterSpacing: "0.22em",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              CITY EXPLORER
            </p>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1"
            style={{
              background: "var(--border)",
              color: "var(--muted)",
              fontFamily: "var(--font-dm-sans)",
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
            title="How to use Hopscotch"
          >
            ?
          </button>
        </div>
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Search */}
      <div className="px-4 pt-4 pb-3">
        <CitySearch selectedCity={selectedCity} onCitySelect={onCitySelect} />
      </div>

      {/* Vibe Filter Chips */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setVibesOpen((v) => !v)}
          className="flex items-center gap-1.5 mb-2"
          style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest">Filter</span>
          {activeVibes.size > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--chip-active-bg)", color: "var(--accent)", border: "1px solid rgba(0,240,255,0.2)" }}
            >
              {activeVibes.size}
            </span>
          )}
          <ChevronDown
            size={13}
            style={{
              color: "var(--muted)",
              transform: vibesOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              marginLeft: "auto",
            }}
          />
        </button>
        {vibesOpen && (
          <div className="flex flex-wrap gap-1.5">
            {VIBES.map(({ label, Icon }) => {
              const isActive = activeVibes.has(label);
              return (
                <button
                  key={label}
                  onClick={() => onVibeToggle(label)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                  style={{
                    background: isActive ? "var(--chip-active-bg)" : "var(--chip-bg)",
                    border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    fontFamily: "var(--font-dm-sans)",
                    boxShadow: isActive
                      ? "0 0 0 2px rgba(0,240,255,0.1), 0 0 8px rgba(0,240,255,0.07)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={11} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)", margin: "0 16px" }} />

      {/* My List */}
      <div className={`flex flex-col px-4 pt-4 pb-3 ${scrollable ? "" : "flex-1 min-h-0"}`}>
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-dm-sans)" }}
          >
            My List
          </span>
          <span
            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold"
            style={{
              background: shortlist.length > 0 ? "var(--accent-secondary)" : "var(--border)",
              color: shortlist.length > 0 ? "#fff" : "var(--muted)",
              fontFamily: "var(--font-dm-sans)",
              animation: badgePulsing ? "badge-pulse 0.45s ease" : "none",
              boxShadow: shortlist.length > 0 ? "0 0 8px rgba(255,45,120,0.4)" : "none",
            }}
          >
            {shortlist.length}
          </span>
        </div>
        <div className={scrollable ? "" : "flex-1 overflow-y-auto min-h-0"}>
          <MyListSection
            shortlist={shortlist}
            onRemove={onRemoveFromShortlist}
            onReorder={onReorderShortlist}
            onAddSpots={onBrowse}
          />
        </div>
      </div>


      {/* Footer */}
      <div
        className="px-4 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border)", marginTop: scrollable ? "8px" : undefined }}
      >
        <button
          disabled={!canStartRoute}
          onClick={canStartRoute ? onStartRoute : undefined}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: canStartRoute ? "var(--accent)" : "var(--border)",
            color: canStartRoute ? "#0a0a0a" : "var(--muted)",
            fontFamily: "var(--font-dm-sans)",
            letterSpacing: "0.06em",
            cursor: canStartRoute ? "pointer" : "not-allowed",
            boxShadow: canStartRoute
              ? "0 0 20px rgba(0,240,255,0.25), 0 0 40px rgba(0,240,255,0.1)"
              : "none",
            transition: "all 0.2s ease",
          }}
        >
          Start Route
          {shortlist.length >= 2 && (
            <span className="ml-2 opacity-60 text-xs">
              ({shortlist.length} stops)
            </span>
          )}
        </button>
        <div className="flex justify-center mt-3">
          <button onClick={() => setShowContact(true)} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Contact
          </button>
        </div>
      </div>
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </aside>
  );
}
