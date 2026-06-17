import { AmenitySummary, PropertyLocation, RiskInsight, ScoreSet } from "@/lib/types";

export function buildScores(location: PropertyLocation, amenities: AmenitySummary[], risks: RiskInsight): ScoreSet {
  const amenityScore = average(amenities.map((item) => item.densityScore));
  const transport = categoryScore(amenities, "Public Transport");
  const healthcare = average([categoryScore(amenities, "Hospitals"), categoryScore(amenities, "Clinics"), categoryScore(amenities, "Pharmacies")]);
  const education = average([categoryScore(amenities, "Schools"), categoryScore(amenities, "Universities")]);
  const dailyNeeds = average([categoryScore(amenities, "Supermarkets"), categoryScore(amenities, "Pharmacies"), categoryScore(amenities, "Banks & ATMs")]);
  const greenAreas = categoryScore(amenities, "Parks");
  const noise = risks.noiseLevel === "Low" ? 78 : risks.noiseLevel === "Moderate" ? 62 : 45;
  const safety = risks.safetyLevel === "Strong" ? 78 : risks.safetyLevel === "Moderate" ? 62 : 50;
  const earthquakeRisk = risks.seismicRiskLevel === "low" ? 78 : risks.seismicRiskLevel === "medium" ? 58 : risks.seismicRiskLevel === "high" ? 42 : 55;
  const disasterRisk = average([earthquakeRisk, risks.tsunamiRisk ? 48 : 70]);
  const walkability = Math.min(95, average([amenityScore, dailyNeeds, transport]) + 8);
  const familySuitability = average([dailyNeeds, greenAreas, safety, education, earthquakeRisk]);
  const investment = average([amenityScore, transport, dailyNeeds, walkability]) + (isMajorMetro(location) ? 4 : 0);
  const overall = average([amenityScore, transport, healthcare, education, dailyNeeds, greenAreas, noise, safety, disasterRisk, walkability, familySuitability, investment]);
  return {
    overall,
    amenities: amenityScore,
    transport,
    healthcare,
    education,
    dailyNeeds,
    greenAreas,
    noise,
    safety,
    disasterRisk,
    earthquakeRisk,
    walkability,
    familySuitability,
    investment
  };
}

function categoryScore(amenities: AmenitySummary[], category: string): number {
  return amenities.find((item) => item.category === category)?.densityScore ?? 45;
}

function average(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

function isMajorMetro(location: PropertyLocation): boolean {
  return Math.abs(location.latitude - 41.0082) < 0.8 && Math.abs(location.longitude - 28.9784) < 0.8;
}
