"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserWithSession, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { revokeAllSessions, revokeSessionById, rotateSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import type { FormState } from "@/lib/actions/auth";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
});

export async function updateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/", "layout");
  return {};
}

const passwordSchema = z.object({
  current: z.string().min(1, "Please enter your current password."),
  next: z.string().min(8, "New password must be at least 8 characters."),
});

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if (!verifyPassword(parsed.data.current, user.passwordHash)) {
    return { error: "Your current password is incorrect." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.next) },
  });
  // Changing the password signs out every other device and rotates this
  // session's token.
  await revokeAllSessions(user.id);
  await rotateSession(user.id);
  await logAudit(user.id, "auth.password.changed", `User:${user.id}`);
  return {};
}

/** Sign out one of the user's other sessions (devices). */
export async function revokeOneSession(formData: FormData): Promise<void> {
  const current = await getCurrentUserWithSession();
  if (!current) return;
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId || sessionId === current.session.id) return;
  const revoked = await revokeSessionById(current.user.id, sessionId);
  if (revoked) {
    await logAudit(current.user.id, "auth.session.revoked", `Session:${sessionId}`);
  }
  revalidatePath("/", "layout");
}

/** Sign out everywhere except the current device. */
export async function revokeOtherSessions(): Promise<void> {
  const current = await getCurrentUserWithSession();
  if (!current) return;
  await revokeAllSessions(current.user.id, current.session.id);
  await logAudit(current.user.id, "auth.session.revoked-others", `User:${current.user.id}`);
  revalidatePath("/", "layout");
}
