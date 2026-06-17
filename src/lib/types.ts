export type AmenityCategory =
  | "Supermarkets"
  | "Pharmacies"
  | "Hospitals"
  | "Clinics"
  | "Schools"
  | "Universities"
  | "Parks"
  | "Public Transport"
  | "Restaurants & Cafes"
  | "Banks & ATMs"
  | "Gyms"
  | "Parking"
  | "Police Stations";

export type AnalyzeInput = {
  address?: string;
  latitude?: number;
  longitude?: number;
  listingUrl?: string;
  includeRoast?: boolean;
};

export type PropertyLocation = {
  address: string;
  latitude: number;
  longitude: number;
  listingTitle?: string;
  listingPrice?: string;
  listingUrl?: string;
};

export type AmenitySummary = {
  category: AmenityCategory;
  count300m: number;
  count500m: number;
  count1km: number;
  nearestDistanceMeters?: number;
  densityScore: number;
};

export type ScoreSet = {
  overall: number;
  amenities: number;
  transport: number;
  healthcare: number;
  education: number;
  dailyNeeds: number;
  greenAreas: number;
  noise: number;
  safety: number;
  disasterRisk: number;
  earthquakeRisk: number;
  walkability: number;
  familySuitability: number;
  investment: number;
};

export type RiskInsight = {
  noiseLevel: string;
  noiseExplanation: string;
  safetyLevel: string;
  safetyExplanation: string;
  seismicRiskLevel: "low" | "medium" | "high" | "unknown";
  nearestFaultDistanceKm?: number;
  soilRisk?: string;
  liquefactionRisk?: string;
  historicalEarthquakes?: string[];
  tsunamiRisk?: string;
  naturalDisasterSummary: string;
  dataQuality: string;
};

export type AISummary = {
  shortSummary: string;
  pros: string[];
  cons: string[];
  suitableFor: string[];
  redFlags: string[];
  advice: string;
  questionsToAsk: string[];
  finalVerdict: string;
  roast?: string;
};

export type CheckHouseReport = {
  id: string;
  location: PropertyLocation;
  scores: ScoreSet;
  amenities: AmenitySummary[];
  risks: RiskInsight;
  aiSummary: AISummary;
  isFavorite: boolean;
  createdAt: string;
};
