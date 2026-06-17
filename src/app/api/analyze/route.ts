import { z } from "zod";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { reportDisclaimerPayload } from "@/services/aiSummary";
import { getAuthUser } from "@/services/auth";
import { buildReport } from "@/services/reportBuilder";
import { saveReport } from "@/services/reportRepository";
import { checkAndRecordUsage } from "@/services/usage";

export const runtime = "nodejs";

const analyzeSchema = z.object({
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  listingUrl: z.string().url().optional(),
  includeRoast: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const input = analyzeSchema.parse(await request.json());
    if (!input.address && (input.latitude === undefined || input.longitude === undefined) && !input.listingUrl) {
      return badRequest("Provide address, coordinates, or listingUrl.");
    }
    const user = await getAuthUser(request);
    const usage = await checkAndRecordUsage(request, user);
    if (!usage.allowed) {
      return forbidden(`Free daily analysis limit reached. Limit: ${usage.limit}.`);
    }
    const report = await buildReport(input);
    const savedReport = await saveReport(report, user);
    return ok({ ...reportDisclaimerPayload(savedReport), usage });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Analysis failed");
  }
}
