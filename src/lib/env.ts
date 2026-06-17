export const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "checkhouse-dev-secret-change-me",
  geminiApiKey: process.env.GEMINI_API_KEY
};

export function isDatabaseConfigured(): boolean {
  return Boolean(env.databaseUrl && env.databaseUrl.trim().length > 0);
}
