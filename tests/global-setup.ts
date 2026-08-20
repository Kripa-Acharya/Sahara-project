import { execSync, spawnSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://sahara:sahara@localhost:5433/sahara_test";

/**
 * Prepare a clean PostgreSQL test database by recreating it and applying the
 * real migration history (`prisma migrate deploy`) — so every test run also
 * validates the migrations. Locally, `npm run db:up` provides the cluster
 * (auto-attempted here); CI supplies TEST_DATABASE_URL for its service
 * container.
 */
export default async function globalSetup() {
  const root = path.resolve(__dirname, "..");

  if (!process.env.TEST_DATABASE_URL) {
    // Best effort: start the local dev cluster if it isn't running.
    spawnSync("npx", ["tsx", "scripts/dev-db.ts", "start"], {
      cwd: root,
      stdio: "pipe",
      shell: process.platform === "win32",
    });
  }

  // Recreate the scratch test database (never pointed at real data — the
  // URL is always an explicit test database).
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, "");
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to reset "${dbName}" — the test database name must contain "test".`,
    );
  }
  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = "/postgres";
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  try {
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.$disconnect();
  }

  execSync("npx prisma migrate deploy", {
    cwd: root,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
