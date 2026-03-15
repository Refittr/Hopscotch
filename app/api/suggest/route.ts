import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { currentSpot, city, options, activeVibes, nearbyBrowsePOIs } =
      await req.json();

    const optionLines = options
      .map(
        (o: { name: string; category: string; directionHint: string }, i: number) =>
          `${i + 1}. ${o.name} (${o.category}) — ${o.directionHint}`
      )
      .join("\n");

    const nearbyNames = (nearbyBrowsePOIs as Array<{ name: string }>)
      .slice(0, 10)
      .map((p) => p.name)
      .join(", ");

    const prompt = `You are a savvy local city guide. A traveller is currently at "${currentSpot.name}" in ${city} and choosing their next stop.

Their 3 next-hop options are:
${optionLines}

Their interests: ${activeVibes.length > 0 ? activeVibes.join(", ") : "general sightseeing"}.
Other nearby spots in the area (not on their route): ${nearbyNames || "none known"}.

Suggest ONE hidden gem or underrated spot from the nearby list that would be worth a quick detour on the way to one of their hop options. Make it feel like a local tip, not a tourist brochure.

Reply with ONLY valid JSON — no markdown, no explanation, just the object:
{"name":"<spot name>","nearOption":"<exact name of the hop option it's near>","reason":"<one punchy sentence why it's worth it>"}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) {
      return NextResponse.json({ error: "No JSON in response" }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    console.error("[/api/suggest]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
