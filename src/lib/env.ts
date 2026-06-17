export const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "checkhouse-dev-secret-change-me",
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  overpassApiUrl: process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter",
  revenueCatApiKey: process.env.REVENUECAT_API_KEY,
  freeDailyLimit: Number(process.env.FREE_DAILY_LIMIT || 3)
};

export function isDatabaseConfigured(): boolean {
  return Boolean(env.databaseUrl && env.databaseUrl.trim().length > 0);
}
