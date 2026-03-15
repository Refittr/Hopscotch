"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary, useMap } from "@vis.gl/react-google-maps";
import type { SelectedCity } from "@/app/page";
import type { POI } from "@/types/poi";
import { SEARCH_TYPES, getCategoryLabel } from "@/lib/placesCategories";

const RADIUS = 5000; // 5km

interface Props {
  selectedCity: SelectedCity | null;
  onPoisLoaded: (pois: POI[]) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function POIFetcher({ selectedCity, onPoisLoaded, onLoadingChange }: Props) {
  const placesLib = useMapsLibrary("places");
  const map = useMap();
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);
  const fetchedCityKeyRef = useRef<string | null>(null);
  const onPoisLoadedRef = useRef(onPoisLoaded);
  const onLoadingChangeRef = useRef(onLoadingChange);

  useEffect(() => { onPoisLoadedRef.current = onPoisLoaded; }, [onPoisLoaded]);
  useEffect(() => { onLoadingChangeRef.current = onLoadingChange; }, [onLoadingChange]);

  // Initialise PlacesService once map+lib are ready
  useEffect(() => {
    if (!placesLib || !map || serviceRef.current) return;
    serviceRef.current = new placesLib.PlacesService(map);
  }, [placesLib, map]);

  // Clear when city is cleared
  useEffect(() => {
    if (!selectedCity) {
      fetchedCityKeyRef.current = null;
      onPoisLoadedRef.current([]);
    }
  }, [selectedCity]);

  // Fetch POIs when city changes
  useEffect(() => {
    if (!selectedCity || !serviceRef.current) return;

    const cityKey = `${selectedCity.lat.toFixed(4)},${selectedCity.lng.toFixed(4)}`;
    if (fetchedCityKeyRef.current === cityKey) return;
    fetchedCityKeyRef.current = cityKey;

    onLoadingChangeRef.current(true);

    const service = serviceRef.current;
    const location = new google.maps.LatLng(selectedCity.lat, selectedCity.lng);
    const collected = new Map<string, POI>();
    let pending = SEARCH_TYPES.length;

    const done = () => {
      pending--;
      if (pending === 0) {
        onPoisLoadedRef.current(Array.from(collected.values()));
        onLoadingChangeRef.current(false);
      }
    };

    for (const type of SEARCH_TYPES) {
      service.nearbySearch(
        { location, radius: RADIUS, type },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            for (const place of results) {
              if (!place.place_id || !place.geometry?.location) continue;
              if (collected.has(place.place_id)) continue;

              const types = place.types ?? [];
              collected.set(place.place_id, {
                placeId: place.place_id,
                name: place.name ?? "Unknown",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                rating: place.rating,
                ratingsCount: place.user_ratings_total,
                types,
                category: getCategoryLabel(types),
                photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 300, maxHeight: 300 }),
                isOpen: place.opening_hours?.isOpen?.(),
              });
            }
          }
          done();
        }
      );
    }
  }, [selectedCity]);

  return null;
}
