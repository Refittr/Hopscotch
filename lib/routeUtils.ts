import type { POI } from "@/types/poi";
import type { HopOption } from "@/types/route";

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function bearingDeg(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function toCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export function walkMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 5) * 60));
}

export function formatDistanceKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export function formatWalkTime(mins: number): string {
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function directionHint(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): string {
  const km = haversineKm(from, to);
  return `${formatDistanceKm(km)} ${toCardinal(bearingDeg(from, to))}`;
}

export function computeHopOptions(
  from: { lat: number; lng: number },
  remaining: POI[],
  count = 3
): HopOption[] {
  return remaining
    .map((poi) => {
      const km = haversineKm(from, { lat: poi.lat, lng: poi.lng });
      return {
        poi,
        distanceKm: km,
        walkMinutes: walkMinutes(km),
        directionHint: directionHint(from, { lat: poi.lat, lng: poi.lng }),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count)
    .map((o, i) => ({ ...o, optionIndex: (i + 1) as 1 | 2 | 3 }));
}
