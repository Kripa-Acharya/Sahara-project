/** Runs once when the Next.js server starts. */
export async function register() {
  const { validateEnv } = await import("./lib/env");
  validateEnv();
}
