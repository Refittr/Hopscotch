import { NextRequest, NextResponse } from "next/server";

const GMAPS_KEY = () =>
  process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) return NextResponse.json({ description: null });

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=editorial_summary` +
      `&key=${GMAPS_KEY()}`;

    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    const data = await res.json();

    const description: string | null =
      data.result?.editorial_summary?.overview ?? null;

    return NextResponse.json({ description });
  } catch {
    return NextResponse.json({ description: null });
  }
}
