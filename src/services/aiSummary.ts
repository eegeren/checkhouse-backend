import OpenAI from "openai";
import { AISummary, CheckHouseReport, PropertyLocation, RiskInsight, ScoreSet } from "@/lib/types";

type SummaryInput = {
  location: PropertyLocation;
  scores: ScoreSet;
  risks: RiskInsight;
  includeRoast?: boolean;
};

export async function generateAISummary(input: SummaryInput): Promise<AISummary> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackSummary(input);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You write concise property location analysis. Never claim a building is safe or will collapse. Always frame risk as location-based estimate, not engineering report. Return JSON only."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ]
    });
    const parsed = JSON.parse(completion.choices[0]?.message.content ?? "{}") as Partial<AISummary>;
    return {
      ...fallbackSummary(input),
      ...parsed,
      pros: parsed.pros?.slice(0, 5) ?? fallbackSummary(input).pros,
      cons: parsed.cons?.slice(0, 5) ?? fallbackSummary(input).cons
    };
  } catch {
    return fallbackSummary(input);
  }
}

export function fallbackSummary(input: SummaryInput): AISummary {
  const { location, scores, risks, includeRoast } = input;
  const strong = scores.overall >= 70;
  return {
    shortSummary: `${location.address} has ${strong ? "strong" : "mixed"} daily convenience signals, a transport score of ${scores.transport}, and ${risks.seismicRiskLevel} seismic risk based on available location data.`,
    pros: [
      "Nearby amenities support routine daily needs.",
      "Walkability and local convenience are measurable from open location signals.",
      "The report gives a practical due-diligence checklist before committing."
    ],
    cons: [
      "Noise, safety, and disaster values are estimates from available signals.",
      "Building condition, title/legal status, and appraisal value require licensed professionals."
    ],
    suitableFor: scores.familySuitability > 68 ? ["Families", "Long-term renters", "Remote workers"] : ["Urban renters", "Students", "Investors comparing alternatives"],
    redFlags: [
      "Confirm official earthquake, soil, flood, and zoning records.",
      "Visit during commute and evening hours to validate noise and access."
    ],
    advice: "Use CheckHouse as a shortlist and negotiation tool, then verify the property with licensed local experts before buying or renting.",
    questionsToAsk: [
      "What are the building age, permit, and retrofit records?",
      "Are official disaster and soil reports available for this parcel?",
      "What are realistic commute times at peak hours?"
    ],
    finalVerdict: strong ? "Promising location, worth deeper due diligence." : "Useful but uneven location; compare with stronger alternatives.",
    roast: includeRoast ? "The listing can call itself central, but the amenities are still asking for a calendar invite." : undefined
  };
}

export function reportDisclaimerPayload(report: CheckHouseReport) {
  return {
    ...report,
    disclaimer: "CheckHouse provides informational location-based analysis only. It is not a real estate appraisal, legal advice, safety certification, or engineering report. Always consult licensed professionals before buying or renting.",
    engineeringDisclaimer: "This is a location-based risk estimate, not an engineering report."
  };
}
