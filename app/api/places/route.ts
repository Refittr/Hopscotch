/**
 * Supabase table — run once in the Supabase SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS cached_places (
 *     id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
 *     city_name       TEXT         NOT NULL,
 *     place_id        TEXT         NOT NULL UNIQUE,
 *     name            TEXT         NOT NULL,
 *     lat             DOUBLE PRECISION NOT NULL,
 *     lng             DOUBLE PRECISION NOT NULL,
 *     rating          DOUBLE PRECISION,
 *     total_ratings   INTEGER,
 *     category        TEXT         NOT NULL,
 *     types           TEXT[]       NOT NULL DEFAULT '{}',
 *     photo_reference TEXT,
 *     cached_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
 *   );
 *
 *   CREATE INDEX IF NOT EXISTS idx_cached_places_city ON cached_places(city_name);
 *   CREATE INDEX IF NOT EXISTS idx_cached_places_ts   ON cached_places(cached_at);
 *
 *   -- Disable RLS (public cache table — safe since only the server writes here):
 *   ALTER TABLE cached_places DISABLE ROW LEVEL SECURITY;
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SEARCH_TYPES, getCategoryLabel } from "@/lib/placesCategories";

const CACHE_TTL_MS   = 24 * 60 * 60 * 1000;   // 24 hours
const CLEANUP_AGE_MS = 7  * 24 * 60 * 60 * 1000; // 7 days
const RADIUS         = 5000;
const CACHE_VERSION  = "v2"; // bump when cached data shape changes

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Google Maps key — prefer a server-only var, fall back to the public one
const GMAPS_KEY = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function photoUrl(ref: string) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photo_reference=${ref}&key=${GMAPS_KEY()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { cityName, lat, lng }: { cityName: string; lat: number; lng: number } =
      await req.json();

    const cacheKey = `${cityName}::${CACHE_VERSION}`;

    // ── Cleanup: delete entries older than 7 days ──────────────────────────
    const cleanup = new Date(Date.now() - CLEANUP_AGE_MS).toISOString();
    await db.from("cached_places").delete().lt("cached_at", cleanup);

    // ── Check for fresh cache ──────────────────────────────────────────────
    const freshSince = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data: cached, error: cacheErr } = await db
      .from("cached_places")
      .select("place_id, name, lat, lng, rating, total_ratings, category, types, photo_reference")
      .eq("city_name", cacheKey)
      .gte("cached_at", freshSince);

    if (!cacheErr && cached && cached.length > 0) {
      const pois = cached.map((row) => ({
        placeId:      row.place_id,
        name:         row.name,
        lat:          row.lat,
        lng:          row.lng,
        rating:       row.rating    ?? undefined,
        ratingsCount: row.total_ratings ?? undefined,
        types:        row.types     ?? [],
        category:     row.category,
        photoUrl:     row.photo_reference ? photoUrl(row.photo_reference) : undefined,
      }));
      return NextResponse.json(pois);
    }

    // ── Cache miss — fetch from Google Places API ──────────────────────────
    const collected = new Map<string, {
      placeId: string; name: string; lat: number; lng: number;
      rating?: number; ratingsCount?: number;
      types: string[]; category: string; photoRef?: string; isOpen?: boolean; vicinity?: string;
    }>();

    const addPlace = (place: GooglePlace, extraType?: string) => {
      if (!place.place_id || !place.geometry?.location) return;
      const types = [...(place.types ?? []), ...(extraType ? [extraType] : [])];
      if (collected.has(place.place_id)) {
        if (extraType) {
          const existing = collected.get(place.place_id)!;
          if (!existing.types.includes(extraType)) existing.types.push(extraType);
        }
        return;
      }
      collected.set(place.place_id, {
        placeId:      place.place_id,
        name:         place.name ?? "Unknown",
        lat:          place.geometry.location.lat,
        lng:          place.geometry.location.lng,
        rating:       place.rating,
        ratingsCount: place.user_ratings_total,
        types,
        category:     getCategoryLabel(types),
        photoRef:     place.photos?.[0]?.photo_reference,
        isOpen:       place.opening_hours?.open_now,
        vicinity:     place.vicinity,
      });
    };

    await Promise.all([
      ...SEARCH_TYPES.map(async (type) => {
        try {
          const url =
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
            `?location=${lat},${lng}&radius=${RADIUS}&type=${type}&key=${GMAPS_KEY()}`;
          const res  = await fetch(url, { next: { revalidate: 0 } });
          const data = await res.json();
          if (data.status !== "OK" || !data.results) return;
          for (const place of data.results as GooglePlace[]) addPlace(place);
        } catch { /* non-fatal */ }
      }),
      // LGBT keyword search — tags results with "lgbtq_venue"
      (async () => {
        try {
          for (const keyword of ["gay bar", "LGBT venue"]) {
            const url =
              `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
              `?location=${lat},${lng}&radius=${RADIUS}&keyword=${encodeURIComponent(keyword)}&key=${GMAPS_KEY()}`;
            const res  = await fetch(url, { next: { revalidate: 0 } });
            const data = await res.json();
            if (data.status !== "OK" || !data.results) continue;
            for (const place of data.results as GooglePlace[]) addPlace(place, "lgbtq_venue");
          }
        } catch { /* non-fatal */ }
      })(),
    ]);

    const pois = Array.from(collected.values());

    // ── Upsert to Supabase ─────────────────────────────────────────────────
    if (pois.length > 0) {
      const rows = pois.map((p) => ({
        city_name:       cacheKey,
        place_id:        p.placeId,
        name:            p.name,
        lat:             p.lat,
        lng:             p.lng,
        rating:          p.rating        ?? null,
        total_ratings:   p.ratingsCount  ?? null,
        category:        p.category,
        types:           p.types,
        photo_reference: p.photoRef      ?? null,
        cached_at:       new Date().toISOString(),
      }));
      // fire-and-forget; don't block the response on a write failure
      db.from("cached_places").upsert(rows, { onConflict: "place_id" }).then(
        ({ error }) => { if (error) console.error("[/api/places] upsert error:", error.message); }
      );
    }

    // ── Return POI array ───────────────────────────────────────────────────
    const result = pois.map((p) => ({
      placeId:      p.placeId,
      name:         p.name,
      lat:          p.lat,
      lng:          p.lng,
      rating:       p.rating,
      ratingsCount: p.ratingsCount,
      types:        p.types,
      category:     p.category,
      photoUrl:     p.photoRef ? photoUrl(p.photoRef) : undefined,
      isOpen:       p.isOpen,
      vicinity:     p.vicinity,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/places]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ── Minimal Google Places Nearby Search shape ──────────────────────────────
interface GooglePlace {
  place_id?: string;
  name?: string;
  geometry?: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  photos?: Array<{ photo_reference: string }>;
  opening_hours?: { open_now?: boolean };
  vicinity?: string;
}
