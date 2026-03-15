/**
 * Supabase table — run once in the SQL editor:
 *
 *   CREATE TABLE IF NOT EXISTS shared_routes (
 *     id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *     short_code TEXT        NOT NULL UNIQUE,
 *     city_name  TEXT        NOT NULL,
 *     stops      JSONB       NOT NULL DEFAULT '[]',
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_shared_routes_code ON shared_routes(short_code);
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export async function POST(req: NextRequest) {
  const { cityName, stops } = await req.json();
  if (!cityName || !Array.isArray(stops) || stops.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Try up to 5 times to get a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = randomCode();
    const { error } = await supabase.from("shared_routes").insert({
      short_code: shortCode,
      city_name: cityName,
      stops,
    });
    if (!error) return NextResponse.json({ shortCode });
    if (!error.message.includes("unique")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate unique code" }, { status: 500 });
}
