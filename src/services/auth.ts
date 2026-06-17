import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { env, isDatabaseConfigured } from "@/lib/env";

export type AuthUser = {
  id: string;
  email: string;
  isPremium: boolean;
};

type TokenPayload = {
  sub: string;
  email: string;
  premium: boolean;
  exp: number;
};

export async function loginWithEmail(emailInput: string): Promise<{ user: AuthUser; token: string; mockMode: boolean }> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Valid email is required.");
  }

  if (!isDatabaseConfigured()) {
    const user = { id: `demo_${hashEmail(email)}`, email, isPremium: false };
    return { user, token: signToken(user), mockMode: true };
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
    include: { subscription: true }
  });

  const authUser = {
    id: user.id,
    email: user.email,
    isPremium: user.subscription?.status === "active"
  };
  return { user: authUser, token: signToken(authUser), mockMode: false };
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  if (!isDatabaseConfigured()) {
    return { id: payload.sub, email: payload.email, isPremium: payload.premium };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { subscription: true }
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    isPremium: user.subscription?.status === "active"
  };
}

function signToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    premium: user.isPremium,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  };
  const body = base64url(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (!safeEqual(signature, expected)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function sign(value: string): string {
  return createHmac("sha256", env.jwtSecret).update(value).digest("base64url");
}

function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function hashEmail(email: string): string {
  return createHmac("sha256", env.jwtSecret).update(email).digest("hex").slice(0, 16);
}
