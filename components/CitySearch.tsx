"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import type { SelectedCity } from "@/app/page";

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface Props {
  selectedCity: SelectedCity | null;
  onCitySelect: (city: SelectedCity | null) => void;
}

export default function CitySearch({ selectedCity, onCitySelect }: Props) {
  const placesLib = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialise services once library is loaded
  useEffect(() => {
    if (!placesLib) return;
    autocompleteRef.current = new placesLib.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();
    sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
  }, [placesLib]);

  // Fetch suggestions as user types
  useEffect(() => {
    if (!autocompleteRef.current || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    autocompleteRef.current.getPlacePredictions(
      {
        input: query,
        types: ["(cities)"],
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (predictions, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        setSuggestions(
          predictions.map((p) => ({
            placeId: p.place_id,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text ?? "",
          }))
        );
        setOpen(true);
      }
    );
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { placeId: suggestion.placeId },
      (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) return;
        const loc = results[0].geometry.location;
        onCitySelect({
          name: suggestion.mainText,
          lat: loc.lat(),
          lng: loc.lng(),
        });
        setQuery(suggestion.mainText);
        setOpen(false);
        // Refresh session token after billable call
        if (placesLib) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
      }
    );
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onCitySelect(null);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg transition-all"
        style={{
          background: "var(--input-bg)",
          border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          style={{ color: "var(--muted)", flexShrink: 0 }}
        >
          <path
            d="M10 6.5C10 8.43 8.43 10 6.5 10C4.57 10 3 8.43 3 6.5C3 4.57 4.57 3 6.5 3C8.43 3 10 4.57 10 6.5ZM9.44 10.15L12.15 12.85"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={query}
          placeholder="Search a city..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-dm-sans)",
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            // If user starts editing after a city was selected, clear selection
            if (selectedCity) onCitySelect(null);
          }}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
        />
        {(selectedCity || query) && (
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // prevent input blur before click registers
              handleClear();
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)" }}
            aria-label="Clear search"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-lg overflow-hidden z-50"
          style={{
            background: "var(--sidebar-bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.placeId}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors group"
              style={{
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--input-bg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "var(--accent)", flexShrink: 0 }}
              >
                <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 2C7.03 2 3 6.03 3 11C3 16.25 10.5 22 12 22C13.5 22 21 16.25 21 11C21 6.03 16.97 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <div className="min-w-0">
                <p
                  className="text-sm truncate"
                  style={{
                    color: "var(--foreground)",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {s.mainText}
                </p>
                {s.secondaryText && (
                  <p
                    className="text-xs truncate"
                    style={{
                      color: "var(--muted)",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {s.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
