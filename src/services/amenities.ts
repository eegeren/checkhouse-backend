import { AmenityCategory, AmenitySummary, PropertyLocation } from "@/lib/types";
import { hash } from "./geocoding";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

const categories: AmenityCategory[] = [
  "Supermarkets",
  "Pharmacies",
  "Hospitals",
  "Clinics",
  "Schools",
  "Universities",
  "Parks",
  "Public Transport",
  "Restaurants & Cafes",
  "Banks & ATMs",
  "Gyms",
  "Parking",
  "Police Stations"
];

// Nearby amenities are fetched from OpenStreetMap Overpass API only.
// CheckHouse intentionally does not use Google Maps APIs for geocoding or POI data.
export async function fetchAmenitySummaries(location: PropertyLocation): Promise<AmenitySummary[]> {
  try {
    const query = buildOverpassQuery(location.latitude, location.longitude);
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      body: query,
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(`Overpass failed: ${response.status}`);
    const data = (await response.json()) as { elements?: Array<{ lat?: number; lon?: number; tags?: Record<string, string> }> };
    const elements = data.elements ?? [];
    return categories.map((category) => summarizeCategory(category, location, elements));
  } catch {
    return mockAmenitySummaries(location);
  }
}

function summarizeCategory(category: AmenityCategory, location: PropertyLocation, elements: Array<{ lat?: number; lon?: number; tags?: Record<string, string> }>): AmenitySummary {
  const filtered = elements.filter((element) => matchesCategory(category, element.tags ?? {}));
  const distances = filtered
    .map((element) => distanceMeters(location.latitude, location.longitude, element.lat, element.lon))
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);
  const count300m = distances.filter((distance) => distance <= 300).length;
  const count500m = distances.filter((distance) => distance <= 500).length;
  const count1km = distances.filter((distance) => distance <= 1000).length;
  return {
    category,
    count300m,
    count500m,
    count1km,
    nearestDistanceMeters: Math.round(distances[0] ?? 0) || undefined,
    densityScore: Math.min(100, count300m * 18 + count500m * 9 + count1km * 4)
  };
}

function buildOverpassQuery(latitude: number, longitude: number): string {
  return `[out:json][timeout:10];
(
  node(around:1000,${latitude},${longitude})["amenity"];
  node(around:1000,${latitude},${longitude})["shop"];
  node(around:1000,${latitude},${longitude})["leisure"];
  node(around:1000,${latitude},${longitude})["public_transport"];
  node(around:1000,${latitude},${longitude})["highway"="bus_stop"];
  node(around:1000,${latitude},${longitude})["railway"="station"];
);
out center;`;
}

function matchesCategory(category: AmenityCategory, tags: Record<string, string>): boolean {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const leisure = tags.leisure;
  const highway = tags.highway;
  const railway = tags.railway;
  const publicTransport = tags.public_transport;
  switch (category) {
    case "Supermarkets": return shop === "supermarket" || shop === "convenience";
    case "Pharmacies": return amenity === "pharmacy";
    case "Hospitals": return amenity === "hospital";
    case "Clinics": return amenity === "clinic" || amenity === "doctors";
    case "Schools": return amenity === "school" || amenity === "kindergarten";
    case "Universities": return amenity === "university" || amenity === "college";
    case "Parks": return leisure === "park";
    case "Public Transport": return Boolean(publicTransport) || amenity === "bus_station" || highway === "bus_stop" || railway === "station";
    case "Restaurants & Cafes": return amenity === "restaurant" || amenity === "cafe" || amenity === "bar";
    case "Banks & ATMs": return amenity === "bank" || amenity === "atm";
    case "Gyms": return leisure === "fitness_centre";
    case "Parking": return amenity === "parking";
    case "Police Stations": return amenity === "police";
  }
}

function mockAmenitySummaries(location: PropertyLocation): AmenitySummary[] {
  const seed = Math.abs(hash(`${location.address}${location.latitude}${location.longitude}`));
  return categories.map((category, index) => {
    const base = 1 + ((seed + index * 11) % 8);
    return {
      category,
      count300m: Math.floor(base / 3),
      count500m: Math.floor(base / 2) + 1,
      count1km: base + 3,
      nearestDistanceMeters: 90 + ((seed + index * 73) % 650),
      densityScore: Math.min(100, 45 + base * 7)
    };
  });
}

function distanceMeters(lat1: number, lon1: number, lat2?: number, lon2?: number): number | undefined {
  if (lat2 === undefined || lon2 === undefined) return undefined;
  const r = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
