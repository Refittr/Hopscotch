import type { POI } from "./poi";

export type HopPosition =
  | POI
  | { lat: number; lng: number; name: string; isGeolocation: true };

export interface HopOption {
  poi: POI;
  distanceKm: number;
  walkMinutes: number;
  directionHint: string;
  optionIndex: 1 | 2 | 3;
}

export interface CompletedHop {
  from: HopPosition;
  to: POI;
  walkMinutes: number;
  distanceKm: number;
}

export interface AISuggestion {
  name: string;
  nearOption: string;
  reason: string;
}

export type RouteState =
  | { phase: "picking_start" }
  | {
      phase: "hopping";
      cityName: string;
      currentPosition: HopPosition;
      visitedIds: Set<string>;
      remainingPois: POI[];
      completedHops: CompletedHop[];
      hopOptions: HopOption[];
      aiSuggestion: AISuggestion | null;
      aiLoading: boolean;
    }
  | {
      phase: "complete";
      cityName: string;
      completedHops: CompletedHop[];
      totalWalkMinutes: number;
      totalDistanceKm: number;
    };
