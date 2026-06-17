import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";
import { CheckHouseReport } from "@/lib/types";
import { AuthUser } from "./auth";

const globalForReports = globalThis as unknown as { checkHouseReports?: Map<string, CheckHouseReport[]> };
const memoryReports = globalForReports.checkHouseReports ?? new Map<string, CheckHouseReport[]>();
globalForReports.checkHouseReports = memoryReports;

export async function saveReport(report: CheckHouseReport, user: AuthUser | null): Promise<CheckHouseReport> {
  if (!isDatabaseConfigured()) {
    const key = user?.id ?? "anonymous";
    const reports = memoryReports.get(key) ?? [];
    memoryReports.set(key, [report, ...reports.filter((item) => item.id !== report.id)].slice(0, 100));
    return report;
  }

  const created = await prisma.report.create({
    data: {
      userId: user?.id,
      address: report.location.address,
      latitude: report.location.latitude,
      longitude: report.location.longitude,
      overallScore: report.scores.overall,
      amenityScore: report.scores.amenities,
      transportScore: report.scores.transport,
      healthcareScore: report.scores.healthcare,
      educationScore: report.scores.education,
      dailyNeedsScore: report.scores.dailyNeeds,
      greenAreasScore: report.scores.greenAreas,
      safetyScore: report.scores.safety,
      noiseScore: report.scores.noise,
      disasterRiskScore: report.scores.disasterRisk,
      earthquakeRiskScore: report.scores.earthquakeRisk,
      walkabilityScore: report.scores.walkability,
      familyScore: report.scores.familySuitability,
      investmentScore: report.scores.investment,
      rawLocationJson: report.location as unknown as Prisma.InputJsonValue,
      rawScoresJson: report.scores as unknown as Prisma.InputJsonValue,
      rawAmenitiesJson: report.amenities as unknown as Prisma.InputJsonValue,
      rawRiskJson: report.risks as unknown as Prisma.InputJsonValue,
      aiSummary: report.aiSummary.shortSummary,
      aiDetailsJson: report.aiSummary as unknown as Prisma.InputJsonValue,
      prosJson: report.aiSummary.pros as unknown as Prisma.InputJsonValue,
      consJson: report.aiSummary.cons as unknown as Prisma.InputJsonValue,
      verdict: report.aiSummary.finalVerdict
    }
  });

  return { ...report, id: created.id, createdAt: created.createdAt.toISOString() };
}

export async function listReports(user: AuthUser | null): Promise<CheckHouseReport[]> {
  if (!isDatabaseConfigured()) {
    return memoryReports.get(user?.id ?? "anonymous") ?? [];
  }

  const rows = await prisma.report.findMany({
    where: user ? { userId: user.id } : { userId: null },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return rows.map((row) => ({
    id: row.id,
    location: (row.rawLocationJson as CheckHouseReport["location"] | null) ?? {
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude
    },
    scores: (row.rawScoresJson as CheckHouseReport["scores"] | null) ?? {
      overall: row.overallScore,
      amenities: row.amenityScore,
      transport: row.transportScore,
      healthcare: row.healthcareScore,
      education: row.educationScore,
      dailyNeeds: row.dailyNeedsScore,
      greenAreas: row.greenAreasScore,
      noise: row.noiseScore,
      safety: row.safetyScore,
      disasterRisk: row.disasterRiskScore,
      earthquakeRisk: row.earthquakeRiskScore,
      walkability: row.walkabilityScore,
      familySuitability: row.familyScore,
      investment: row.investmentScore
    },
    amenities: row.rawAmenitiesJson as CheckHouseReport["amenities"],
    risks: row.rawRiskJson as CheckHouseReport["risks"],
    aiSummary: (row.aiDetailsJson as CheckHouseReport["aiSummary"] | null) ?? {
      shortSummary: row.aiSummary,
      pros: row.prosJson as string[],
      cons: row.consJson as string[],
      suitableFor: [],
      redFlags: [],
      advice: row.verdict,
      questionsToAsk: [],
      finalVerdict: row.verdict
    },
    isFavorite: false,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function deleteReport(id: string, user: AuthUser | null): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    const key = user?.id ?? "anonymous";
    const reports = memoryReports.get(key) ?? [];
    const next = reports.filter((report) => report.id !== id);
    memoryReports.set(key, next);
    return next.length !== reports.length;
  }

  const deleted = await prisma.report.deleteMany({
    where: { id, userId: user?.id ?? null }
  });
  return deleted.count > 0;
}
