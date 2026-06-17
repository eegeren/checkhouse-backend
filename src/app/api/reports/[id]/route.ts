import { ok, serverError } from "@/lib/http";
import { getAuthUser } from "@/services/auth";
import { deleteReport } from "@/services/reportRepository";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    return ok({ deleted: await deleteReport(id, user), id });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "Could not delete report.");
  }
}
