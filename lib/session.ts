import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import type { Session, User } from "@prisma/client";

/**
 * Server-side sessions.
 *
 * The browser cookie carries only an opaque random token. The database stores
 * the SHA-256 hash of that token, so neither a database leak nor a log leak
 * yields a usable session. Sessions can be listed and revoked per device, and
 * are rotated on login and password change.
 *
 * Raw tokens, cookie values and hashes are never logged.
 */

const COOKIE_NAME = "sahara_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
/** lastActiveAt writes are throttled to at most one per this interval. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function requestMeta(): Promise<{ userAgent: string | null; ipAddress: string | null }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    return {
      userAgent: h.get("user-agent")?.slice(0, 250) ?? null,
      ipAddress: forwarded ? forwarded.split(",")[0]!.trim().slice(0, 60) : null,
    };
  } catch {
    return { userAgent: null, ipAddress: null };
  }
}

/** Create a new session for the user and set the cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const meta = await requestMeta();
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + MAX_AGE_SECONDS * 1000),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** The current valid session joined with its user, or null. */
export async function readSessionWithUser(): Promise<
  { session: Session; user: User } | null
> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    !session.user.isActive
  ) {
    return null;
  }

  if (Date.now() - session.lastActiveAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session
      .update({ where: { id: session.id }, data: { lastActiveAt: new Date() } })
      .catch(() => {});
  }

  const { user, ...rest } = session;
  return { session: rest, user };
}

/** Revoke the current session and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session
      .updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => {});
  }
  store.delete(COOKIE_NAME);
}

/** Revoke every session for a user. Optionally keep one session alive. */
export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await db.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}

/** Revoke one specific session belonging to the user. */
export async function revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
  const result = await db.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

/** Active sessions for the user, newest activity first. */
export async function listActiveSessions(userId: string): Promise<Session[]> {
  return db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });
}

/** Rotate the current session (new token + row, old one revoked). */
export async function rotateSession(userId: string): Promise<void> {
  await destroySession();
  await createSession(userId);
}
