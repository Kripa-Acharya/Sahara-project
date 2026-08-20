/**
 * Local PostgreSQL for development without Docker.
 *
 * Creates and manages an isolated cluster in .pgdev/ (never touches any
 * system-installed PostgreSQL service) using locally available PostgreSQL
 * binaries. Listens on port 5433 with user/password sahara/sahara and
 * databases `sahara` (dev) and `sahara_test` (tests).
 *
 *   npx tsx scripts/dev-db.ts start | stop | status
 *
 * Binary discovery order: PG_BIN env var → PATH → common install locations.
 * Prefer docker-compose (docker compose up -d) when Docker is available.
 */
import { execFileSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(__dirname, "..");
const PGDEV = join(ROOT, ".pgdev");
const DATA = join(PGDEV, "data");
const LOG = join(PGDEV, "pg.log");
const PORT = process.env.DEV_PG_PORT ?? "5433";
const USER = "sahara";
const PASSWORD = "sahara";

function findPgBin(): string {
  const candidates = [
    process.env.PG_BIN,
    // PATH
    "",
    // Common Windows locations
    "C:/Program Files/PostgreSQL/18/bin",
    "C:/Program Files/PostgreSQL/17/bin",
    "C:/Program Files/PostgreSQL/16/bin",
    // Common Unix locations
    "/usr/lib/postgresql/18/bin",
    "/usr/lib/postgresql/16/bin",
    "/opt/homebrew/opt/postgresql@18/bin",
    "/opt/homebrew/opt/postgresql@16/bin",
  ].filter((c): c is string => c !== undefined);

  for (const dir of candidates) {
    const exe = dir === "" ? "pg_ctl" : join(dir, "pg_ctl");
    const result = spawnSync(exe, ["--version"], { stdio: "ignore", shell: false });
    if (result.status === 0) return dir;
  }
  console.error(
    "PostgreSQL binaries not found. Install PostgreSQL, set PG_BIN to its bin directory,\n" +
      "or use Docker instead: docker compose up -d",
  );
  process.exit(1);
}

function bin(pgBin: string, tool: string): string {
  return pgBin === "" ? tool : join(pgBin, tool);
}

function isRunning(pgBin: string): boolean {
  const result = spawnSync(bin(pgBin, "pg_isready"), ["-h", "localhost", "-p", PORT], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function start(pgBin: string) {
  if (isRunning(pgBin)) {
    console.log(`PostgreSQL already running on port ${PORT}.`);
    return;
  }
  if (!existsSync(DATA)) {
    console.log("Initialising local cluster in .pgdev/ …");
    mkdirSync(PGDEV, { recursive: true });
    const pwfile = join(PGDEV, "pwfile");
    writeFileSync(pwfile, PASSWORD);
    execFileSync(
      bin(pgBin, "initdb"),
      ["-D", DATA, "-U", USER, `--pwfile=${pwfile}`, "-A", "scram-sha-256", "-E", "UTF8"],
      { stdio: "pipe" },
    );
  }
  console.log(`Starting PostgreSQL on port ${PORT} …`);
  execFileSync(
    bin(pgBin, "pg_ctl"),
    ["-D", DATA, "-o", `-p ${PORT}`, "-l", LOG, "-w", "start"],
    { stdio: "pipe" },
  );
  // Ensure databases exist (idempotent).
  for (const dbName of ["sahara", "sahara_test"]) {
    const check = spawnSync(
      bin(pgBin, "psql"),
      ["-U", USER, "-h", "localhost", "-p", PORT, "-d", "postgres", "-Atc",
        `SELECT 1 FROM pg_database WHERE datname='${dbName}'`],
      { env: { ...process.env, PGPASSWORD: PASSWORD }, encoding: "utf8" },
    );
    if (check.stdout?.trim() !== "1") {
      execFileSync(
        bin(pgBin, "psql"),
        ["-U", USER, "-h", "localhost", "-p", PORT, "-d", "postgres", "-c",
          `CREATE DATABASE ${dbName}`],
        { env: { ...process.env, PGPASSWORD: PASSWORD }, stdio: "pipe" },
      );
    }
  }
  console.log("Ready. Connection string:");
  console.log(`  postgresql://${USER}:${PASSWORD}@localhost:${PORT}/sahara`);
}

function stop(pgBin: string) {
  if (!existsSync(DATA)) {
    console.log("No local cluster found.");
    return;
  }
  spawnSync(bin(pgBin, "pg_ctl"), ["-D", DATA, "-m", "fast", "stop"], { stdio: "inherit" });
}

const command = process.argv[2] ?? "start";
const pgBin = findPgBin();
if (command === "start") start(pgBin);
else if (command === "stop") stop(pgBin);
else if (command === "status") {
  console.log(isRunning(pgBin) ? `Running on port ${PORT}.` : "Not running.");
} else {
  console.error("Usage: tsx scripts/dev-db.ts [start|stop|status]");
  process.exit(1);
}
