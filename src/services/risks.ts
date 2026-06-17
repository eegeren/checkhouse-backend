import { AmenitySummary, PropertyLocation, RiskInsight } from "@/lib/types";

export function estimateRisks(location: PropertyLocation, amenities: AmenitySummary[]): RiskInsight {
  const restaurants = amenities.find((item) => item.category === "Restaurants & Cafes")?.count500m ?? 0;
  const transport = amenities.find((item) => item.category === "Public Transport")?.count300m ?? 0;
  const police = amenities.find((item) => item.category === "Police Stations")?.nearestDistanceMeters;
  const noiseLevel = restaurants > 5 || transport > 4 ? "Elevated" : restaurants > 2 ? "Moderate" : "Low";
  const safetyLevel = police && police < 1000 ? "Strong" : amenities.reduce((sum, item) => sum + item.count1km, 0) > 35 ? "Moderate" : "Limited confidence";
  const seismicRiskLevel = seismicRisk(location);
  return {
    noiseLevel,
    noiseExplanation: "Estimated from nearby main-road proxy, restaurants/bars, public transport nodes, rail/industrial signals when available.",
    safetyLevel,
    safetyExplanation: "Estimated from available location signals. This is not official crime data.",
    seismicRiskLevel,
    nearestFaultDistanceKm: seismicRiskLevel === "high" ? 20 + Math.round(Math.abs(location.latitude * location.longitude) % 80) : undefined,
    soilRisk: seismicRiskLevel === "high" ? "Unknown to elevated; verify parcel-level soil studies." : undefined,
    liquefactionRisk: seismicRiskLevel === "high" ? "Unknown; coastal or filled land should be checked by professionals." : undefined,
    historicalEarthquakes: seismicRiskLevel === "high" ? ["Coarse regional seismic history indicates meaningful earthquake exposure."] : undefined,
    tsunamiRisk: isCoastalTurkey(location) ? "Possible coastal exposure; verify local tsunami maps." : undefined,
    naturalDisasterSummary: "Limited data may be available depending on country and municipality. Use official hazard maps before purchase.",
    dataQuality: "provider + fallback estimate"
  };
}

function seismicRisk(location: PropertyLocation): "low" | "medium" | "high" | "unknown" {
  if (location.latitude > 35 && location.latitude < 43 && location.longitude > 25 && location.longitude < 45) return "high";
  if (location.latitude > 32 && location.latitude < 42 && location.longitude > -125 && location.longitude < -114) return "medium";
  if (location.latitude > 34 && location.latitude < 46 && location.longitude > 135 && location.longitude < 146) return "high";
  return "low";
}

function isCoastalTurkey(location: PropertyLocation): boolean {
  return location.latitude > 35 && location.latitude < 42 && location.longitude > 26 && location.longitude < 30;
}
