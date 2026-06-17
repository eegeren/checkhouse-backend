import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http";
import { loginWithEmail } from "@/services/auth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const session = await loginWithEmail(email);
    return ok(session);
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest("Valid email is required.");
    return serverError(error instanceof Error ? error.message : "Login failed.");
  }
}
