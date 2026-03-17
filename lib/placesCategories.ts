import type { POI } from "@/types/poi";

// ── Nearby Search types ──────────────────────────────────────────────────────
export const NEARBY_TYPES = [
  "tourist_attraction", "museum", "art_gallery", "library", "church",
  "park", "zoo", "aquarium", "amusement_park", "restaurant", "cafe",
  "bakery", "bar", "night_club", "shopping_mall", "book_store",
  "bowling_alley", "movie_theater", "spa", "stadium", "gym",
] as const;

// ── Text Search queries ──────────────────────────────────────────────────────
export const TEXT_SEARCHES: { query: string; tag: string }[] = [
  { query: "hidden gems",          tag: "hidden_gem"  },
  { query: "best things to do",    tag: "things_to_do" },
  { query: "historic landmarks",   tag: "landmark"    },
  { query: "live music venues",    tag: "live_music"  },
  { query: "street art",           tag: "street_art"  },
  { query: "markets",              tag: "market"      },
  { query: "viewpoints",           tag: "viewpoint"   },
  { query: "secret spots",         tag: "hidden_gem"  },
  { query: "off the beaten path",  tag: "hidden_gem"  },
  { query: "comedy clubs",         tag: "comedy"      },
  { query: "gardens",              tag: "garden"      },
];

// ── Vibe chip definitions ─────────────────────────────────────────────────────
export const VIBE_CONFIG: Record<string, {
  emoji: string;
  nearbyTypes: string[];
  textTags: string[];
}> = {
  "Historical": {
    emoji: "🏛",
    nearbyTypes: ["church", "tourist_attraction", "city_hall", "courthouse", "hindu_temple", "mosque", "synagogue", "cemetery"],
    textTags: ["landmark"],
  },
  "Arts & Culture": {
    emoji: "🎨",
    nearbyTypes: ["museum", "art_gallery", "library"],
    textTags: ["street_art"],
  },
  "Food": {
    emoji: "🍽",
    nearbyTypes: ["restaurant", "cafe", "bakery", "meal_takeaway"],
    textTags: [],
  },
  "Drinks & Nightlife": {
    emoji: "🍺",
    nearbyTypes: ["bar", "night_club", "liquor_store"],
    textTags: ["live_music", "comedy"],
  },
  "Shopping": {
    emoji: "🛍",
    nearbyTypes: ["shopping_mall", "clothing_store", "book_store"],
    textTags: ["market"],
  },
  "Outdoors": {
    emoji: "🌳",
    nearbyTypes: ["park", "zoo", "campground", "natural_feature", "botanical_garden"],
    textTags: ["viewpoint", "garden"],
  },
  "Family": {
    emoji: "👨‍👩‍👧",
    nearbyTypes: ["amusement_park", "aquarium", "zoo", "bowling_alley", "movie_theater"],
    textTags: [],
  },
  "Live Music & Entertainment": {
    emoji: "🎵",
    nearbyTypes: ["night_club", "stadium", "movie_theater"],
    textTags: ["live_music", "comedy"],
  },
  "Wellness": {
    emoji: "💆",
    nearbyTypes: ["spa", "gym", "beauty_salon"],
    textTags: [],
  },
  "Hidden Gems": {
    emoji: "💎",
    nearbyTypes: [],
    textTags: ["hidden_gem"],
  },
};

// ── Derive all filter categories for a place ──────────────────────────────────
export function getCategories(types: string[], textTags: string[]): string[] {
  const cats: string[] = [];
  for (const [name, config] of Object.entries(VIBE_CONFIG)) {
    const hasType = config.nearbyTypes.some((t) => types.includes(t));
    const hasTag  = config.textTags.some((t) => textTags.includes(t));
    if (hasType || hasTag) cats.push(name);
  }
  return cats;
}

// ── Human-readable label for a place (used on the card) ──────────────────────
export function getCategoryLabel(types: string[]): string {
  if (types.includes("museum"))           return "Museum";
  if (types.includes("art_gallery"))      return "Gallery";
  if (types.includes("library"))          return "Library";
  if (types.includes("restaurant"))       return "Restaurant";
  if (types.includes("cafe"))             return "Café";
  if (types.includes("bakery"))           return "Bakery";
  if (types.includes("night_club"))       return "Nightlife";
  if (types.includes("bar"))              return "Bar";
  if (types.includes("park"))             return "Park";
  if (types.includes("zoo"))              return "Zoo";
  if (types.includes("aquarium"))         return "Aquarium";
  if (types.includes("amusement_park"))   return "Attraction";
  if (types.includes("bowling_alley"))    return "Bowling";
  if (types.includes("movie_theater"))    return "Cinema";
  if (types.includes("spa"))              return "Spa";
  if (types.includes("gym"))              return "Gym";
  if (types.includes("stadium"))          return "Stadium";
  if (types.includes("shopping_mall"))    return "Shopping";
  if (types.includes("book_store"))       return "Book Store";
  if (types.includes("hidden_gem"))       return "Hidden Gem";
  if (
    types.includes("church") ||
    types.includes("hindu_temple") ||
    types.includes("mosque") ||
    types.includes("synagogue") ||
    types.includes("city_hall") ||
    types.includes("courthouse")
  ) return "Landmark";
  if (types.includes("tourist_attraction")) return "Attraction";
  return "Place";
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Museum:      "🏛️",
    Gallery:     "🎨",
    Library:     "📚",
    Restaurant:  "🍽️",
    "Café":      "☕",
    Bakery:      "🥐",
    Bar:         "🍺",
    Nightlife:   "🌙",
    Park:        "🌿",
    Zoo:         "🦁",
    Aquarium:    "🐠",
    Attraction:  "🎡",
    Bowling:     "🎳",
    Cinema:      "🎬",
    Spa:         "💆",
    Gym:         "💪",
    Stadium:     "🏟️",
    Shopping:    "🛍️",
    "Book Store":"📖",
    "Hidden Gem":"💎",
    Landmark:    "⛪",
    Place:       "📍",
  };
  return map[category] ?? "📍";
}

// ── Filter POIs by active vibe chips ─────────────────────────────────────────
export function poiMatchesVibes(poi: POI, activeVibes: Set<string>): boolean {
  if (activeVibes.size === 0) return true;
  // Use pre-computed categories if available (v3 data)
  if (poi.categories && poi.categories.length > 0) {
    return Array.from(activeVibes).some((v) => poi.categories!.includes(v));
  }
  // Fallback for older cached data: check types against VIBE_CONFIG
  return Array.from(activeVibes).some((vibe) => {
    const config = VIBE_CONFIG[vibe];
    if (!config) return false;
    return config.nearbyTypes.some((t) => poi.types.includes(t));
  });
}
