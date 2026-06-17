import { ok, unauthorized } from "@/lib/http";
import { getAuthUser } from "@/services/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  return ok({ user });
}
