import { env } from "@/lib/env";
import { AISummary, CheckHouseReport, PropertyLocation, RiskInsight, ScoreSet } from "@/lib/types";

type SummaryInput = {
  location: PropertyLocation;
  scores: ScoreSet;
  risks: RiskInsight;
  includeRoast?: boolean;
};

export async function generateAISummary(input: SummaryInput): Promise<AISummary> {
  if (env.geminiApiKey) {
    const geminiSummary = await generateWithGemini(input);
    if (geminiSummary) return geminiSummary;
  }

  return fallbackSummary(input);
}

async function generateWithGemini(input: SummaryInput): Promise<AISummary | null> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.45
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You write concise property location analysis for CheckHouse.",
                  "Never claim a building is safe or will collapse.",
                  "Always frame risk as a location-based estimate, not an engineering report.",
                  "Return JSON matching these fields exactly: shortSummary, pros, cons, suitableFor, redFlags, advice, questionsToAsk, finalVerdict, roast.",
                  JSON.stringify(input)
                ].join("\n")
              }
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n");
    return normalizeAISummary(input, text);
  } catch {
    return null;
  }
}

function normalizeAISummary(input: SummaryInput, rawContent?: string | null): AISummary {
  const fallback = fallbackSummary(input);
  const parsed = parseSummaryJson(rawContent) as Partial<AISummary>;
  return {
    ...fallback,
    ...parsed,
    pros: parsed.pros?.slice(0, 5) ?? fallback.pros,
    cons: parsed.cons?.slice(0, 5) ?? fallback.cons,
    suitableFor: parsed.suitableFor?.slice(0, 5) ?? fallback.suitableFor,
    redFlags: parsed.redFlags?.slice(0, 5) ?? fallback.redFlags,
    questionsToAsk: parsed.questionsToAsk?.slice(0, 6) ?? fallback.questionsToAsk
  };
}

function parseSummaryJson(rawContent?: string | null): Partial<AISummary> {
  if (!rawContent) return {};
  const cleaned = rawContent
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonText) as Partial<AISummary>;
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
