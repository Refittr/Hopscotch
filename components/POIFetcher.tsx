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

    fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cityName: selectedCity.name,
        lat:      selectedCity.lat,
        lng:      selectedCity.lng,
      }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((pois: POI[]) => {
        onPoisLoadedRef.current(pois);
        onLoadingChangeRef.current(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("[POIFetcher]", err);
        onPoisLoadedRef.current([]);
        onLoadingChangeRef.current(false);
      });
  }, [selectedCity]);

  return null;
}
