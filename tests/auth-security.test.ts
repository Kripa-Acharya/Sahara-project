import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { login, resetPassword } from "@/lib/actions/auth";
import { issueToken, consumeToken } from "@/lib/tokens";
import {
  createSession,
  listActiveSessions,
  readSessionWithUser,
  revokeAllSessions,
  revokeSessionById,
} from "@/lib/session";
import { resetRateLimits } from "@/lib/rate-limit";
import { __clearCookies } from "next/headers";
import { createAndLogin, formData, uniqueEmail } from "./helpers";

beforeEach(() => {
  resetRateLimits();
  __clearCookies();
});

describe("login throttling and lockout", () => {
  it("rate-limits repeated login attempts per IP+email", async () => {
    const email = uniqueEmail("throttle");
    let lastError = "";
    for (let i = 0; i < 11; i++) {
      const result = await login(undefined, formData({ email, password: "wrong" }));
      lastError = result?.error ?? "";
    }
    expect(lastError).toMatch(/too many attempts/i);
  });

  it("locks an account after repeated failures, even with the right password", async () => {
    const email = uniqueEmail("lockout");
    const user = await db.user.create({
      data: { email, passwordHash: hashPassword("Right@123"), name: "L", role: "FAMILY" },
    });
    // 10 wrong attempts (fresh limiter windows so DB lockout is what trips).
    for (let i = 0; i < 10; i++) {
      resetRateLimits();
      await login(undefined, formData({ email, password: "wrong" }));
    }
    const locked = await db.user.findUnique({ where: { id: user.id } });
    expect(locked!.lockedUntil).not.toBeNull();
    expect(locked!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

    // Correct password during lockout → same generic error (no oracle).
    resetRateLimits();
    const result = await login(undefined, formData({ email, password: "Right@123" }));
    expect(result?.error).toMatch(/incorrect/i);
  });

  it("records audit events for failed and successful logins", async () => {
    const email = uniqueEmail("audit");
    const user = await db.user.create({
      data: { email, passwordHash: hashPassword("Right@123"), name: "A", role: "ADMIN" },
    });
    await login(undefined, formData({ email, password: "nope" }));
    await expect(login(undefined, formData({ email, password: "Right@123" }))).rejects.toThrow(
      /REDIRECT/,
    );
    const events = await db.auditLog.findMany({
      where: { actorId: user.id, action: { startsWith: "auth.login" } },
    });
    const actions = events.map((e) => e.action).sort();
    expect(actions).toContain("auth.login.failed");
    expect(actions).toContain("auth.login.success");
  });
});

describe("verification tokens", () => {
  it("is single-use and invalidates previous tokens of the same type", async () => {
    const user = await createAndLogin("FAMILY");
    const first = await issueToken(user.id, "PASSWORD_RESET");
    const second = await issueToken(user.id, "PASSWORD_RESET");

    // Issuing `second` invalidated `first`.
    expect(await consumeToken(first, "PASSWORD_RESET")).toBeNull();
    // `second` works exactly once.
    expect(await consumeToken(second, "PASSWORD_RESET")).toBe(user.id);
    expect(await consumeToken(second, "PASSWORD_RESET")).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const user = await createAndLogin("FAMILY");
    const raw = await issueToken(user.id, "PASSWORD_RESET");
    await db.verificationToken.updateMany({
      where: { userId: user.id, type: "PASSWORD_RESET" },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await consumeToken(raw, "PASSWORD_RESET")).toBeNull();
  });

  it("rejects a token of the wrong type", async () => {
    const user = await createAndLogin("FAMILY");
    const raw = await issueToken(user.id, "EMAIL_VERIFY");
    expect(await consumeToken(raw, "PASSWORD_RESET")).toBeNull();
  });
});

describe("password reset", () => {
  it("resets the password and revokes every session", async () => {
    const user = await createAndLogin("FAMILY");
    expect(await readSessionWithUser()).not.toBeNull();

    const token = await issueToken(user.id, "PASSWORD_RESET");
    await expect(
      resetPassword(undefined, formData({ token, password: "NewPassword@1" })),
    ).rejects.toThrow(/REDIRECT:\/login/);

    // All sessions are gone.
    expect(await listActiveSessions(user.id)).toHaveLength(0);
    expect(await readSessionWithUser()).toBeNull();

    // New password works.
    resetRateLimits();
    await expect(
      login(undefined, formData({ email: user.email, password: "NewPassword@1" })),
    ).rejects.toThrow(/REDIRECT/);
  });
});

describe("session management", () => {
  it("lists active sessions and revokes a single one", async () => {
    const user = await createAndLogin("FAMILY");
    // A second "device".
    __clearCookies();
    await createSession(user.id);

    const sessions = await listActiveSessions(user.id);
    expect(sessions.length).toBe(2);

    const revoked = await revokeSessionById(user.id, sessions[1]!.id);
    expect(revoked).toBe(true);
    expect(await listActiveSessions(user.id)).toHaveLength(1);
  });

  it("a revoked session no longer authenticates", async () => {
    const user = await createAndLogin("COMPANION");
    expect(await readSessionWithUser()).not.toBeNull();
    await revokeAllSessions(user.id);
    expect(await readSessionWithUser()).toBeNull();
  });

  it("cannot revoke another user's session", async () => {
    const alice = await createAndLogin("FAMILY", "Alice");
    const aliceSessions = await listActiveSessions(alice.id);
    __clearCookies();
    const mallory = await createAndLogin("FAMILY", "Mallory");
    const result = await revokeSessionById(mallory.id, aliceSessions[0]!.id);
    expect(result).toBe(false);
    expect(await listActiveSessions(alice.id)).toHaveLength(1);
  });
});
