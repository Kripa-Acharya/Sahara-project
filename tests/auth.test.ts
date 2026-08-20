import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { login, register } from "@/lib/actions/auth";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { createAndLogin, formData, logoutTestUser, uniqueEmail } from "./helpers";

describe("passwords", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("Secret@123");
    expect(hash).toContain(":");
    expect(verifyPassword("Secret@123", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("authentication", () => {
  beforeEach(async () => {
    await logoutTestUser();
  });

  it("registers a family member and creates a profile", async () => {
    const email = uniqueEmail("register");
    await expect(
      register(undefined, formData({
        name: "New Family",
        email,
        phone: "+61-400-000-000",
        password: "Password@123",
        role: "FAMILY",
        country: "Australia",
      })),
    ).rejects.toThrow(/REDIRECT:/);

    const user = await db.user.findUnique({ where: { email }, include: { familyProfile: true } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("FAMILY");
    expect(user!.familyProfile).not.toBeNull();
    // Session cookie was set by register:
    expect((await getCurrentUser())?.email).toBe(email);
  });

  it("rejects a wrong password on login", async () => {
    const email = uniqueEmail("login");
    await db.user.create({
      data: { email, passwordHash: hashPassword("Right@123"), name: "L", role: "FAMILY" },
    });
    const result = await login(undefined, formData({ email, password: "Wrong@123" }));
    expect(result?.error).toMatch(/incorrect/i);
  });

  it("logs in with correct credentials and redirects by role", async () => {
    const email = uniqueEmail("login-ok");
    await db.user.create({
      data: { email, passwordHash: hashPassword("Right@123"), name: "L", role: "ADMIN" },
    });
    await expect(
      login(undefined, formData({ email, password: "Right@123" })),
    ).rejects.toThrow("REDIRECT:/admin");
  });
});

describe("role protection", () => {
  it("redirects anonymous users to login", async () => {
    await logoutTestUser();
    await expect(requireUser("FAMILY")).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects users with the wrong role to their own home", async () => {
    await createAndLogin("COMPANION");
    await expect(requireUser("ADMIN")).rejects.toThrow("REDIRECT:/companion");
  });

  it("lets the right role through", async () => {
    const user = await createAndLogin("FAMILY");
    const result = await requireUser("FAMILY");
    expect(result.id).toBe(user.id);
  });
});
