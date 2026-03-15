import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { currentSpot, city, options, activeVibes, nearbyBrowsePOIs, shortlistContext } =
      await req.json();

    const shortlistLines = (shortlistContext as Array<{ name: string; category: string }>)
      .map((s) => `- ${s.name} (${s.category})`)
      .join("\n");

    const optionLines = (options as Array<{ name: string; category: string; directionHint: string }>)
      .map((o, i) => `${i + 1}. ${o.name} (${o.category}) — ${o.directionHint}`)
      .join("\n");

    const nearbyLines = (nearbyBrowsePOIs as Array<{ name: string; category: string; rating?: number }>)
      .map((p) => `- ${p.name} (${p.category})${p.rating ? ` ★${p.rating}` : ""}`)
      .join("\n");

    const vibeNote =
      activeVibes.length > 0
        ? `Their selected vibes: ${(activeVibes as string[]).join(", ")}.`
        : "";

    const prompt = `You are a sharp local city guide in ${city}. A traveller is currently at "${currentSpot.name}" and deciding their next stop.

Their curated route so far — this is their taste:
${shortlistLines || "Just starting out"}

${vibeNote}

Their 3 next-hop options:
${optionLines}

Other spots nearby NOT on their list (sorted by proximity, with ratings where available):
${nearbyLines || "none"}

Your job: suggest ONE spot from the nearby list that genuinely fits the character of what they've already picked. It should feel like something a knowledgeable local would mention — not a tourist trap, something that complements their taste.

If nothing nearby clearly fits their vibe, fall back to the highest-rated option in the nearby list.
If the nearby list is empty, invent a plausible local recommendation that fits their taste.

Keep the reason punchy — one sentence, no fluff.

Reply with ONLY valid JSON, no markdown:
{"name":"<spot name>","nearOption":"<exact name of the closest hop option>","reason":"<one sentence why it fits their taste>"}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
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
