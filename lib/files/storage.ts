import { mkdirSync } from "fs";
import { readFile, unlink, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { randomBytes } from "crypto";

/**
 * File storage provider seam.
 *
 * Bytes are stored PRIVATELY — never under /public and never directly
 * reachable by URL. Every read goes through the authorized download route.
 *
 * - `localStorageProvider` (development / single-server): files under
 *   ./storage/uploads (gitignored).
 * - Production contract: an S3-compatible adapter implementing this same
 *   interface with server-side encryption, a private bucket, and short-lived
 *   signed URLs. See docs/SECURITY_MODEL.md and docs/PRODUCTION_ROADMAP.md.
 */
export interface FileStorageProvider {
  key: string;
  /** Persist bytes under a new opaque storage key. */
  put(bytes: Buffer, opts: { kindPrefix: string }): Promise<{ storageKey: string }>;
  /** Retrieve bytes by storage key; null if missing. */
  get(storageKey: string): Promise<Buffer | null>;
  /** Remove bytes (idempotent). */
  delete(storageKey: string): Promise<void>;
}

const STORAGE_ROOT = resolve(process.cwd(), "storage", "uploads");

/** Storage keys are opaque and generated server-side — never derived from
 *  user-supplied names, so path traversal is structurally impossible. */
function newStorageKey(kindPrefix: string): string {
  return `${kindPrefix}/${Date.now()}-${randomBytes(16).toString("hex")}`;
}

function keyToPath(storageKey: string): string {
  // Defense in depth: keys are server-generated, but normalize and confine
  // to the storage root anyway.
  const full = resolve(STORAGE_ROOT, storageKey);
  if (!full.startsWith(STORAGE_ROOT)) throw new Error("Invalid storage key");
  return full;
}

export const localStorageProvider: FileStorageProvider = {
  key: "local",
  async put(bytes, { kindPrefix }) {
    const storageKey = newStorageKey(kindPrefix);
    const path = keyToPath(storageKey);
    mkdirSync(join(path, ".."), { recursive: true });
    await writeFile(path, bytes);
    return { storageKey };
  },
  async get(storageKey) {
    try {
      return await readFile(keyToPath(storageKey));
    } catch {
      return null;
    }
  },
  async delete(storageKey) {
    try {
      await unlink(keyToPath(storageKey));
    } catch {
      // idempotent
    }
  },
};

export function getFileStorageProvider(): FileStorageProvider {
  // Future: switch on FILE_STORAGE_PROVIDER env (s3/gcs/...) with credentials.
  return localStorageProvider;
}

/**
 * Malware-scanning seam. The development scanner performs no real analysis
 * and reports files as clean; production must wire a real engine (e.g.
 * ClamAV or a scanning API). Files stay in SCANNING status until a verdict,
 * and a "dirty" verdict quarantines the file (never served to non-admins).
 */
export interface FileScanner {
  key: string;
  scan(bytes: Buffer): Promise<{ verdict: "clean" | "dirty"; detail?: string }>;
}

export const devScanner: FileScanner = {
  key: "dev-noop",
  async scan() {
    return { verdict: "clean", detail: "dev scanner: no real analysis performed" };
  },
};

export function getFileScanner(): FileScanner {
  return devScanner;
}
