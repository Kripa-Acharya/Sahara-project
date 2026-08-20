"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, revokeAllSessions } from "@/lib/session";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { issueToken, consumeToken } from "@/lib/tokens";
import { getMailProvider } from "@/lib/mail";
import { logAudit } from "@/lib/audit";

export type FormState = { error?: string; ok?: boolean } | undefined;

const GENERIC_LOGIN_ERROR = "Email or password is incorrect.";
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_MINUTES = 15;

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  } catch {
    return "local";
  }
}

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

// ---------- Login ----------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(GENERIC_LOGIN_ERROR),
  password: z.string().min(1, "Please enter your password."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Same throttle response whether or not the account exists.
  const ip = await clientIp();
  if (!checkRateLimit(`login:${ip}:${parsed.data.email}`, RATE_LIMITS.login)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Account temporarily locked → indistinguishable from wrong credentials.
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    await logAudit(user.id, "auth.login.locked", `User:${user.id}`);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    if (user) {
      const failed = user.failedLoginCount + 1;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failed,
          lockedUntil:
            failed >= LOCKOUT_THRESHOLD
              ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
              : null,
        },
      });
      await logAudit(user.id, "auth.login.failed", `User:${user.id}`);
    } else {
      await logAudit(null, "auth.login.failed", "User:unknown");
    }
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (!user.isActive) {
    // Same generic error: do not disclose account state to an attacker.
    await logAudit(user.id, "auth.login.inactive", `User:${user.id}`);
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  await createSession(user.id);
  await logAudit(user.id, "auth.login.success", `User:${user.id}`);
  redirect(homeForRole(user.role));
}

// ---------- Registration ----------

const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  phone: z.string().trim().min(7, "Please enter a phone number we can reach you on."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["FAMILY", "COMPANION"]),
  country: z.string().trim().optional(),
});

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!checkRateLimit(`register:${ip}`, RATE_LIMITS.register)) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
    country: formData.get("country"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "An account with this email already exists. Try logging in instead." };
  }

  const user = await db.user.create({
    data: {
      email: data.email,
      passwordHash: hashPassword(data.password),
      name: data.name,
      phone: data.phone,
      role: data.role,
      countryCode: data.country || null,
      ...(data.role === "FAMILY"
        ? { familyProfile: { create: { residenceCountry: data.country || null } } }
        : {
            companionProfile: {
              create: { verification: { create: { status: "INCOMPLETE" } } },
            },
          }),
    },
  });

  await sendVerificationEmail(user.id, user.email, user.name);
  await logAudit(user.id, "auth.register", `User:${user.id}`, `role=${data.role}`);

  await createSession(user.id);
  redirect(homeForRole(user.role));
}

// ---------- Email verification ----------

async function sendVerificationEmail(userId: string, email: string, name: string) {
  const token = await issueToken(userId, "EMAIL_VERIFY");
  await getMailProvider().send({
    to: email,
    subject: "Please confirm your email — साहारा",
    text:
      `Namaste ${name},\n\n` +
      `Please confirm your email address so we can reach you with visit updates and safety alerts:\n\n` +
      `${appUrl(`/verify-email?token=${token}`)}\n\n` +
      `This link is valid for 24 hours. If you didn't create a साहारा account, you can ignore this email.`,
  });
}

export async function resendVerificationEmail(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.emailVerifiedAt) return;
  await sendVerificationEmail(user.id, user.email, user.name);
}

/** Consumes the emailed token. Called from the /verify-email page. */
export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const userId = await consumeToken(rawToken, "EMAIL_VERIFY");
  if (!userId) return false;
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  await logAudit(userId, "auth.email.verified", `User:${userId}`);
  return true;
}

// ---------- Password reset ----------

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!checkRateLimit(`pwreset:${ip}`, RATE_LIMITS.passwordReset)) {
    return { error: "Too many requests. Please wait a few minutes and try again." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Please enter your email address." };

  const user = await db.user.findUnique({ where: { email } });
  if (user && user.isActive) {
    const token = await issueToken(user.id, "PASSWORD_RESET");
    await getMailProvider().send({
      to: user.email,
      subject: "Reset your साहारा password",
      text:
        `Namaste ${user.name},\n\n` +
        `Someone asked to reset the password for this account. If it was you, use this link within 30 minutes:\n\n` +
        `${appUrl(`/reset-password?token=${token}`)}\n\n` +
        `If it wasn't you, you can safely ignore this email — your password is unchanged.`,
    });
    await logAudit(user.id, "auth.password.reset.requested", `User:${user.id}`);
  }
  // Identical response either way: no account enumeration.
  return { ok: true };
}

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const userId = await consumeToken(parsed.data.token, "PASSWORD_RESET");
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(parsed.data.password),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
  // A password reset invalidates every existing session.
  await revokeAllSessions(userId);
  await logAudit(userId, "auth.password.reset.completed", `User:${userId}`);
  redirect("/login?reset=1");
}

// ---------- Logout ----------

export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await logAudit(user.id, "auth.logout", `User:${user.id}`);
  redirect("/");
}
