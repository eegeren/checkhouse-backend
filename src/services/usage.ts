import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";
import { AuthUser } from "./auth";

const FREE_DAILY_LIMIT = 3;
const globalForUsage = globalThis as unknown as { checkHouseUsage?: Map<string, number> };
const memoryUsage = globalForUsage.checkHouseUsage ?? new Map<string, number>();
globalForUsage.checkHouseUsage = memoryUsage;

export type UsageResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  premium: boolean;
};

export async function checkAndRecordUsage(request: Request, user: AuthUser | null): Promise<UsageResult> {
  if (user?.isPremium) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, limit: Number.MAX_SAFE_INTEGER, premium: true };
  }

  const key = user?.id ?? ipHash(request);
  const date = startOfToday();
  const limit = FREE_DAILY_LIMIT;

  if (!isDatabaseConfigured()) {
    const memoryKey = `${key}:${date.toISOString()}`;
    const current = memoryUsage.get(memoryKey) ?? 0;
    if (current >= limit) return { allowed: false, remaining: 0, limit, premium: false };
    memoryUsage.set(memoryKey, current + 1);
    return { allowed: true, remaining: Math.max(0, limit - current - 1), limit, premium: false };
  }

  const existing = await prisma.analysisUsage.findFirst({
    where: user ? { userId: user.id, date } : { ipHash: key, date }
  });

  if (existing && existing.count >= limit) {
    return { allowed: false, remaining: 0, limit, premium: false };
  }

  const updated = existing
    ? await prisma.analysisUsage.update({ where: { id: existing.id }, data: { count: { increment: 1 } } })
    : await prisma.analysisUsage.create({ data: { userId: user?.id, ipHash: user ? undefined : key, date, count: 1 } });

  return { allowed: true, remaining: Math.max(0, limit - updated.count), limit, premium: false };
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function ipHash(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return createHash("sha256").update(ip).digest("hex");
}
