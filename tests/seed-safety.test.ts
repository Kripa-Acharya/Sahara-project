import { describe, expect, it } from "vitest";
import { spawnSync } from "child_process";
import path from "path";

const root = path.resolve(__dirname, "..");

function runSeed(env: Record<string, string | undefined>) {
  return spawnSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 60_000,
  });
}

describe("seed safety guard", () => {
  it("refuses to run against a non-local database", () => {
    const result = runSeed({
      DATABASE_URL: "postgresql://sahara:secret@db.production.example:5432/sahara",
      SEED_FORCE: undefined,
      NODE_ENV: undefined,
    });
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).toMatch(/Refusing to seed/);
  });

  it("refuses to run when NODE_ENV is production", () => {
    const result = runSeed({
      NODE_ENV: "production",
      SEED_FORCE: undefined,
    });
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).toMatch(/Refusing to seed/);
  });
});
