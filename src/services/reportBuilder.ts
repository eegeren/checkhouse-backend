import { randomUUID } from "crypto";
import { AnalyzeInput, CheckHouseReport } from "@/lib/types";
import { fetchAmenitySummaries } from "./amenities";
import { generateAISummary } from "./aiSummary";
import { resolveLocation } from "./geocoding";
import { estimateRisks } from "./risks";
import { buildScores } from "./scoring";
import { parseListingUrl } from "./listingParser";

export async function buildReport(input: AnalyzeInput): Promise<CheckHouseReport> {
  let listingAddress = input.address;
  let listingTitle: string | undefined;
  let listingPrice: string | undefined;

  if (input.listingUrl) {
    const parsed = await parseListingUrl(input.listingUrl);
    listingAddress = listingAddress || parsed.address;
    listingTitle = parsed.title;
    listingPrice = parsed.price;
  }

  const location = await resolveLocation({
    address: listingAddress,
    latitude: input.latitude,
    longitude: input.longitude,
    listingUrl: input.listingUrl
  });
  location.listingTitle = listingTitle;
  location.listingPrice = listingPrice;

  const amenities = await fetchAmenitySummaries(location);
  const risks = estimateRisks(location, amenities);
  const scores = buildScores(location, amenities, risks);
  const aiSummary = await generateAISummary({ location, scores, risks, includeRoast: input.includeRoast });

  return {
    id: randomUUID(),
    location,
    scores,
    amenities,
    risks,
    aiSummary,
    isFavorite: false,
    createdAt: new Date().toISOString()
  };
}
