export interface POI {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  ratingsCount?: number;
  types: string[];
  category: string;
  photoUrl?: string;
  isOpen?: boolean;
  vicinity?: string;
}
