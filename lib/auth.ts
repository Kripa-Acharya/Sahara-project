import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSessionWithUser } from "@/lib/session";
import type { Role, User } from "@prisma/client";

/** Current logged-in user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const result = await readSessionWithUser();
  return result?.user ?? null;
}

/** Current user plus the session backing this request (for session UIs). */
export async function getCurrentUserWithSession() {
  return readSessionWithUser();
}

const roleHome: Record<Role, string> = {
  FAMILY: "/family",
  COMPANION: "/companion",
  ADMIN: "/admin",
};

export function homeForRole(role: Role): string {
  return roleHome[role];
}

/** Require a logged-in user with one of the given roles; redirects otherwise. */
export async function requireUser(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

export async function requireFamily() {
  const user = await requireUser("FAMILY");
  const profile = await db.familyProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");
  return { user, profile };
}

export async function requireCompanion() {
  const user = await requireUser("COMPANION");
  const profile = await db.companionProfile.findUnique({
    where: { userId: user.id },
    include: { verification: true },
  });
  if (!profile) redirect("/login");
  return { user, profile };
}

export async function requireAdmin() {
  return requireUser("ADMIN");
}
