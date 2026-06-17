import { ok } from "@/lib/http";
import { isDatabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    status: "ok",
    service: "checkhouse-backend",
    databaseConfigured: isDatabaseConfigured(),
    timestamp: new Date().toISOString()
  });
}
