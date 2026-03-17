"use client";

import { useEffect, useRef } from "react";
import type { SelectedCity } from "@/app/page";
import type { POI } from "@/types/poi";

interface Props {
  selectedCity: SelectedCity | null;
  onPoisLoaded: (pois: POI[]) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function POIFetcher({ selectedCity, onPoisLoaded, onLoadingChange }: Props) {
  const fetchedCityKeyRef  = useRef<string | null>(null);
  const onPoisLoadedRef    = useRef(onPoisLoaded);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const abortRef           = useRef<AbortController | null>(null);

  useEffect(() => { onPoisLoadedRef.current    = onPoisLoaded;    }, [onPoisLoaded]);
  useEffect(() => { onLoadingChangeRef.current = onLoadingChange; }, [onLoadingChange]);

  // Clear when city is deselected
  useEffect(() => {
    if (!selectedCity) {
      fetchedCityKeyRef.current = null;
      abortRef.current?.abort();
      onPoisLoadedRef.current([]);
    }
  }, [selectedCity]);

  // Fetch POIs when city changes (hits /api/places which handles cache)
  useEffect(() => {
    if (!selectedCity) return;

    const cityKey = `${selectedCity.lat.toFixed(4)},${selectedCity.lng.toFixed(4)}`;
    if (fetchedCityKeyRef.current === cityKey) return;
    fetchedCityKeyRef.current = cityKey;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    onLoadingChangeRef.current(true);

    (async () => {
      try {
        const res = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityName: selectedCity.name,
            lat:      selectedCity.lat,
            lng:      selectedCity.lng,
          }),
          signal: controller.signal,
        });

        const reader  = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer      = "";
        let accumulated: POI[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const batch = JSON.parse(line) as POI[];
              accumulated = [...accumulated, ...batch];
              onPoisLoadedRef.current(accumulated);
            } catch { /* skip malformed line */ }
          }
        }

        onLoadingChangeRef.current(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[POIFetcher]", err);
        onPoisLoadedRef.current([]);
        onLoadingChangeRef.current(false);
      }
    })();
  }, [selectedCity]);

  return null;
}
