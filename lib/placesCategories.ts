import type { POI } from "@/types/poi";

// Types to query — each becomes one nearbySearch call
export const SEARCH_TYPES = [
  "tourist_attraction",
  "museum",
  "restaurant",
  "bar",
  "park",
  "night_club",
  "art_gallery",
  "church",
  "amusement_park",
] as const;

// Maps vibe chip label → Google Places types
export const VIBE_TYPES: Record<string, string[]> = {
  Historical: [
    "museum",
    "church",
    "hindu_temple",
    "mosque",
    "synagogue",
    "cemetery",
    "tourist_attraction",
  ],
  "Food & Drink": ["restaurant", "cafe", "bakery", "food", "bar", "meal_takeaway"],
  Nightlife: ["bar", "night_club", "casino"],
  Culture: ["museum", "art_gallery", "library", "movie_theater", "performing_arts_theater"],
  Outdoors: ["park", "natural_feature", "campground", "zoo", "aquarium", "botanical_garden"],
  Family: ["amusement_park", "zoo", "aquarium", "tourist_attraction", "park"],
  "LGBT+": ["lgbtq_venue"],
};

export function getCategoryLabel(types: string[]): string {
  if (types.includes("museum")) return "Museum";
  if (types.includes("art_gallery")) return "Gallery";
  if (types.includes("restaurant")) return "Restaurant";
  if (types.includes("night_club")) return "Nightlife";
  if (types.includes("bar")) return "Bar";
  if (types.includes("park")) return "Park";
  if (types.includes("amusement_park")) return "Attraction";
  if (
    types.includes("church") ||
    types.includes("hindu_temple") ||
    types.includes("mosque") ||
    types.includes("synagogue")
  )
    return "Landmark";
  if (types.includes("tourist_attraction")) return "Attraction";
  return "Place";
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Museum: "🏛️",
    Gallery: "🎨",
    Restaurant: "🍽️",
    Bar: "🍺",
    Nightlife: "🌙",
    Park: "🌿",
    Landmark: "⛪",
    Attraction: "🎡",
    Place: "📍",
  };
  return map[category] ?? "📍";
}

export function poiMatchesVibes(poi: POI, activeVibes: Set<string>): boolean {
  if (activeVibes.size === 0) return true;
  return Array.from(activeVibes).some((vibe) =>
    VIBE_TYPES[vibe]?.some((type) => poi.types.includes(type))
  );
}
