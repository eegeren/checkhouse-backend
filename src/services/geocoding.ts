import { PropertyLocation } from "@/lib/types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_USER_AGENT = "CheckHouse/1.0";

export class AddressNotFoundError extends Error {
  constructor(message = "Address not found.") {
    super(message);
    this.name = "AddressNotFoundError";
  }
}

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
      headers: { "user-agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw new AddressNotFoundError();
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
  } catch (error) {
    if (error instanceof AddressNotFoundError) throw error;
    throw new AddressNotFoundError();
  }

  throw new AddressNotFoundError();
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = new URL("/reverse", NOMINATIM_BASE_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    const response = await fetch(url, {
      headers: { "user-agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw new AddressNotFoundError("Reverse geocoding failed.");
    const result = (await response.json()) as { display_name?: string };
    return result.display_name ?? `Pinned location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch {
    throw new AddressNotFoundError("Reverse geocoding failed.");
  }
}

export function hash(value: string): number {
  return value.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}
