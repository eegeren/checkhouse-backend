import { PropertyLocation } from "@/lib/types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export async function resolveLocation(input: { address?: string; latitude?: number; longitude?: number; listingUrl?: string }): Promise<PropertyLocation> {
  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    return {
      address: await reverseGeocode(input.latitude, input.longitude),
      latitude: input.latitude,
      longitude: input.longitude,
      listingUrl: input.listingUrl
    };
  }

  const address = input.address?.trim() || "Sample property";
  try {
    const url = new URL("/search", NOMINATIM_BASE_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", address);
    const response = await fetch(url, {
      headers: { "user-agent": "CheckHouse/0.1 support@checkhouse.app" },
      signal: AbortSignal.timeout(7000)
    });
    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    if (first) {
      return {
        address: first.display_name,
        latitude: Number(first.lat),
        longitude: Number(first.lon),
        listingUrl: input.listingUrl
      };
    }
  } catch {
    // Fallback below keeps the API usable without network/geocoder availability.
  }

  const seed = Math.abs(hash(address));
  return {
    address,
    latitude: 41.0082 + (seed % 800) / 10000 - 0.04,
    longitude: 28.9784 + (Math.floor(seed / 10) % 800) / 10000 - 0.04,
    listingUrl: input.listingUrl
  };
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = new URL("/reverse", NOMINATIM_BASE_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    const response = await fetch(url, {
      headers: { "user-agent": "CheckHouse/0.1 support@checkhouse.app" },
      signal: AbortSignal.timeout(7000)
    });
    const result = (await response.json()) as { display_name?: string };
    return result.display_name ?? `Pinned location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch {
    return `Pinned location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

export function hash(value: string): number {
  return value.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}
