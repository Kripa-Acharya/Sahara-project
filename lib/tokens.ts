import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import type { TokenType } from "@prisma/client";

/**
 * Single-use verification tokens (email verify, password reset, phone verify).
 * Only the SHA-256 hash is stored; the raw token exists once, inside the
 * message sent to the user, and is never logged.
 */

const TTL_MINUTES: Record<TokenType, number> = {
  EMAIL_VERIFY: 60 * 24, // 24 hours
  PASSWORD_RESET: 30,
  PHONE_VERIFY: 10,
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Create a token for the user, invalidating previous tokens of that type. */
export async function issueToken(userId: string, type: TokenType): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await db.$transaction([
    db.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.verificationToken.create({
      data: {
        tokenHash: hashToken(raw),
        type,
        userId,
        expiresAt: new Date(Date.now() + TTL_MINUTES[type] * 60 * 1000),
      },
    }),
  ]);
  return raw;
}

/**
 * Atomically consume a token: valid, unexpired, unused → marked used.
 * Returns the owning userId, or null.
 */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  if (!/^[0-9a-f]{64}$/.test(raw)) return null;
  const result = await db.verificationToken.updateMany({
    where: {
      tokenHash: hashToken(raw),
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });
  if (result.count === 0) return null;
  const token = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    select: { userId: true },
  });
  return token?.userId ?? null;
}
