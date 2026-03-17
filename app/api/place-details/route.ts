import { NextRequest, NextResponse } from "next/server";

const GMAPS_KEY = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

const PHOTO_BASE = "https://maps.googleapis.com/maps/api/place/photo";

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId)
    return NextResponse.json({ description: null, photos: [], openNow: null, weekdayText: null, reviewSnippet: null });

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=editorial_summary,photos,opening_hours,reviews` +
      `&key=${GMAPS_KEY()}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();
    const result = data.result ?? {};

    const description: string | null = result.editorial_summary?.overview ?? null;

    const photos: string[] = (result.photos ?? [])
      .slice(0, 3)
      .map((p: { photo_reference: string }) =>
        `${PHOTO_BASE}?maxwidth=800&photo_reference=${encodeURIComponent(p.photo_reference)}&key=${GMAPS_KEY()}`
      );

    const openNow: boolean | null = result.opening_hours?.open_now ?? null;
    const weekdayText: string[] | null = result.opening_hours?.weekday_text ?? null;
    const reviewSnippet: string | null = result.reviews?.[0]?.text?.slice(0, 280) ?? null;

    return NextResponse.json({ description, photos, openNow, weekdayText, reviewSnippet });
  } catch {
    return NextResponse.json({ description: null, photos: [], openNow: null, weekdayText: null, reviewSnippet: null });
  }
}
