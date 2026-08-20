/**
 * Environment validation — runs once at server startup (instrumentation.ts).
 * The app refuses to start in production with missing or unsafe configuration.
 * Values are never logged.
 */

const INSECURE_SECRETS = new Set([
  "change-me-to-a-long-random-string",
  "sahara-insecure-dev-secret",
  "sahara-dev-secret-3f9c2b1a8d7e6f5a4b3c2d1e0f9a8b7c",
]);

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const problems: string[] = [];

  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL is not set.");
  } else if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
    problems.push("DATABASE_URL must be a PostgreSQL connection string.");
  }

  const secret = process.env.SESSION_SECRET ?? "";
  if (!secret) {
    problems.push("SESSION_SECRET is not set.");
  } else if (isProduction && (secret.length < 32 || INSECURE_SECRETS.has(secret))) {
    problems.push(
      "SESSION_SECRET is too short or is a known development value. " +
        "Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  if (isProduction && !process.env.APP_URL) {
    problems.push("APP_URL must be set in production (used in emailed links).");
  }

  if (problems.length > 0) {
    const message = `Environment validation failed:\n- ${problems.join("\n- ")}`;
    if (isProduction) {
      throw new Error(message);
    }
    console.warn(`[env] ${message}`);
  }
}
