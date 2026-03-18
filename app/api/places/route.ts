/**
 * Supabase schema — run once in the SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS cached_places (
 *     id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
 *     city_name       TEXT             NOT NULL,
 *     place_id        TEXT             NOT NULL UNIQUE,
 *     name            TEXT             NOT NULL,
 *     lat             DOUBLE PRECISION NOT NULL,
 *     lng             DOUBLE PRECISION NOT NULL,
 *     rating          DOUBLE PRECISION,
 *     total_ratings   INTEGER,
 *     category        TEXT             NOT NULL,
 *     types           TEXT[]           NOT NULL DEFAULT '{}',
 *     categories      TEXT[]           NOT NULL DEFAULT '{}',
 *     photo_reference TEXT,
 *     cached_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
 *   );
 *
 *   -- If the table already exists, add the new column:
 *   ALTER TABLE cached_places ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';
 *
 *   CREATE INDEX IF NOT EXISTS idx_cached_places_city ON cached_places(city_name);
 *   CREATE INDEX IF NOT EXISTS idx_cached_places_ts   ON cached_places(cached_at);
 *   ALTER TABLE cached_places DISABLE ROW LEVEL SECURITY;
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { NEARBY_TYPES, TEXT_SEARCHES, getCategoryLabel, getCategories } from "@/lib/placesCategories";

const CACHE_TTL_MS   = 24 * 60 * 60 * 1000;
const CLEANUP_AGE_MS = 7  * 24 * 60 * 60 * 1000;
const RADIUS         = 5000;
const CACHE_VERSION  = "v5";
const BATCH_SIZE     = 4;
const BATCH_DELAY_MS = 250;

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GMAPS_KEY = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function photoUrl(ref: string) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photo_reference=${ref}&key=${GMAPS_KEY()}`;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

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
  business_status?: string;
}

interface SearchResult {
  places: GooglePlace[];
  nextPageToken?: string;
}

async function nearbySearch(lat: number, lng: number, type: string): Promise<SearchResult> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${RADIUS}&type=${type}&key=${GMAPS_KEY()}`;
    const res  = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return { places: [] };
    return { places: data.results ?? [], nextPageToken: data.next_page_token };
  } catch { return { places: [] }; }
}

async function textSearch(cityName: string, lat: number, lng: number, query: string): Promise<SearchResult> {
  try {
    const q   = encodeURIComponent(`${cityName} ${query}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
      `?query=${q}&location=${lat},${lng}&radius=${RADIUS}&key=${GMAPS_KEY()}`;
    const res  = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return { places: [] };
    return { places: data.results ?? [], nextPageToken: data.next_page_token };
  } catch { return { places: [] }; }
}

async function fetchNextPage(token: string): Promise<SearchResult> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?pagetoken=${token}&key=${GMAPS_KEY()}`;
    const res  = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return { places: [] };
    return { places: data.results ?? [], nextPageToken: data.next_page_token };
  } catch { return { places: [] }; }
}

type CollectedPlace = {
  placeId: string; name: string; lat: number; lng: number;
  rating?: number; ratingsCount?: number;
  types: string[]; textTags: string[];
  category: string; categories: string[];
  photoRef?: string; isOpen?: boolean; vicinity?: string;
};

async function* streamPOIs(cityName: string, lat: number, lng: number) {
  const cacheKey = `${cityName}::${CACHE_VERSION}`;

  // Cleanup old entries (fire-and-forget)
  const cleanupAge = new Date(Date.now() - CLEANUP_AGE_MS).toISOString();
  db.from("cached_places").delete().lt("cached_at", cleanupAge).then(() => {});

  // Cache check
  const freshSince = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data: cached, error: cacheErr } = await db
    .from("cached_places")
    .select("place_id, name, lat, lng, rating, total_ratings, category, types, categories, photo_reference")
    .eq("city_name", cacheKey)
    .gte("cached_at", freshSince);

  if (!cacheErr && cached && cached.length > 0) {
    const pois = cached.map((row) => ({
      placeId:      row.place_id,
      name:         row.name,
      lat:          row.lat,
      lng:          row.lng,
      rating:       row.rating        ?? undefined,
      ratingsCount: row.total_ratings ?? undefined,
      types:        row.types         ?? [],
      categories:   row.categories    ?? [],
      category:     row.category,
      photoUrl:     row.photo_reference ? photoUrl(row.photo_reference) : undefined,
    }));
    yield JSON.stringify(pois);
    return;
  }

  // ── Cache miss — fetch from Google ─────────────────────────────────────────
  const collected = new Map<string, CollectedPlace>();
  const sentIds   = new Set<string>();
  const pendingTokens: { token: string; textTags: string[] }[] = [];

  const addPlace = (place: GooglePlace, textTags: string[]) => {
    if (!place.place_id || !place.geometry?.location) return;
    if (place.business_status && place.business_status !== "OPERATIONAL") return;
    const id    = place.place_id;
    const types = place.types ?? [];

    if (collected.has(id)) {
      // Merge tags
      const existing = collected.get(id)!;
      for (const tag of textTags) {
        if (!existing.textTags.includes(tag)) existing.textTags.push(tag);
      }
      for (const t of types) {
        if (!existing.types.includes(t)) existing.types.push(t);
      }
      existing.categories = getCategories(existing.types, existing.textTags);
      return;
    }

    const allTypes = [...types];
    const allTags  = [...textTags];
    collected.set(id, {
      placeId:      id,
      name:         place.name ?? "Unknown",
      lat:          place.geometry.location.lat,
      lng:          place.geometry.location.lng,
      rating:       place.rating,
      ratingsCount: place.user_ratings_total,
      types:        allTypes,
      textTags:     allTags,
      category:     getCategoryLabel(allTypes),
      categories:   getCategories(allTypes, allTags),
      photoRef:     place.photos?.[0]?.photo_reference,
      isOpen:       place.opening_hours?.open_now,
      vicinity:     place.vicinity,
    });
  };

  const flushNew = (): CollectedPlace[] => {
    const newOnes = Array.from(collected.values()).filter((p) => !sentIds.has(p.placeId));
    newOnes.forEach((p) => sentIds.add(p.placeId));
    return newOnes;
  };

  const toWirePOI = (p: CollectedPlace) => ({
    placeId:      p.placeId,
    name:         p.name,
    lat:          p.lat,
    lng:          p.lng,
    rating:       p.rating,
    ratingsCount: p.ratingsCount,
    types:        p.types,
    categories:   p.categories,
    category:     p.category,
    photoUrl:     p.photoRef ? photoUrl(p.photoRef) : undefined,
    isOpen:       p.isOpen,
    vicinity:     p.vicinity,
  });

  // ── Nearby searches in batches ──────────────────────────────────────────────
  const nearbyList = [...NEARBY_TYPES];
  for (let i = 0; i < nearbyList.length; i += BATCH_SIZE) {
    const batch = nearbyList.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((type) => nearbySearch(lat, lng, type)));
    for (const { places, nextPageToken } of results) {
      for (const p of places) addPlace(p, []);
      if (nextPageToken) pendingTokens.push({ token: nextPageToken, textTags: [] });
    }
    const fresh = flushNew();
    if (fresh.length > 0) yield JSON.stringify(fresh.map(toWirePOI));
    if (i + BATCH_SIZE < nearbyList.length) await sleep(BATCH_DELAY_MS);
  }

  // ── Text searches in batches ────────────────────────────────────────────────
  for (let i = 0; i < TEXT_SEARCHES.length; i += BATCH_SIZE) {
    const batch = TEXT_SEARCHES.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(({ query, tag }) => textSearch(cityName, lat, lng, query).then((r) => ({ ...r, tag })))
    );
    for (const { places, nextPageToken, tag } of results) {
      for (const p of places) addPlace(p, [tag]);
      if (nextPageToken) pendingTokens.push({ token: nextPageToken, textTags: [tag] });
    }
    const fresh = flushNew();
    if (fresh.length > 0) yield JSON.stringify(fresh.map(toWirePOI));
    if (i + BATCH_SIZE < TEXT_SEARCHES.length) await sleep(BATCH_DELAY_MS);
  }

  // ── Pagination (next pages, 2s delay required by Google) ───────────────────
  if (pendingTokens.length > 0) {
    await sleep(2000);
    for (let i = 0; i < pendingTokens.length; i += BATCH_SIZE) {
      const batch = pendingTokens.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(({ token, textTags }) => fetchNextPage(token).then((r) => ({ ...r, textTags })))
      );
      for (const { places, textTags } of results) {
        for (const p of places) addPlace(p, textTags);
      }
      const fresh = flushNew();
      if (fresh.length > 0) yield JSON.stringify(fresh.map(toWirePOI));
      if (i + BATCH_SIZE < pendingTokens.length) await sleep(BATCH_DELAY_MS);
    }
  }

  // ── Cache all results ───────────────────────────────────────────────────────
  const allPlaces = Array.from(collected.values());
  if (allPlaces.length > 0) {
    const rows = allPlaces.map((p) => ({
      city_name:       cacheKey,
      place_id:        p.placeId,
      name:            p.name,
      lat:             p.lat,
      lng:             p.lng,
      rating:          p.rating        ?? null,
      total_ratings:   p.ratingsCount  ?? null,
      category:        p.category,
      types:           p.types,
      categories:      p.categories,
      photo_reference: p.photoRef      ?? null,
      cached_at:       new Date().toISOString(),
    }));
    db.from("cached_places").upsert(rows, { onConflict: "place_id" }).then(
      ({ error }) => { if (error) console.error("[/api/places] upsert:", error.message); }
    );
  }
}

function generatorToStream(gen: AsyncGenerator<string>) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await gen.next();
        if (done) { controller.close(); return; }
        controller.enqueue(encoder.encode(value + "\n"));
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() { gen.return(undefined); },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { cityName, lat, lng }: { cityName: string; lat: number; lng: number } =
      await req.json();
    const gen = streamPOIs(cityName, lat, lng);
    return new Response(generatorToStream(gen), {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[/api/places]", err);
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}
