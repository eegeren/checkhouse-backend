import { created, ok, serverError } from "@/lib/http";
import { getAuthUser } from "@/services/auth";
import { listReports, saveReport } from "@/services/reportRepository";
import { CheckHouseReport } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    return ok({ reports: await listReports(user) });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Could not fetch reports.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    const report = (await request.json()) as CheckHouseReport;
    return created({ report: await saveReport(report, user) });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Could not save report.");
  }
}
