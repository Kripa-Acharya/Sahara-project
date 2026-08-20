import { db } from "@/lib/db";
import type {
  Booking,
  ElderProfile,
  MessageThread,
  StoredFile,
  User,
  VisitReport,
} from "@prisma/client";

/**
 * Centralized authorization policies.
 *
 * Every Server Action and route handler authorizes the authenticated actor
 * here (or with an equivalent ownership-scoped query), independent of any UI
 * state. Policies return the authorized resource (so callers don't re-query)
 * or null when access is denied — callers must treat null as "not found" to
 * avoid disclosing resource existence (IDOR-safe).
 *
 * Roles: FAMILY owns elders/bookings via FamilyProfile; COMPANION accesses
 * only assignments made to them; ADMIN is the operations role (sub-role
 * separation is tracked in docs/PRODUCTION_ROADMAP.md).
 */

async function familyProfileId(user: User): Promise<string | null> {
  if (user.role !== "FAMILY") return null;
  const profile = await db.familyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  return profile?.id ?? null;
}

async function companionProfileId(user: User): Promise<string | null> {
  if (user.role !== "COMPANION") return null;
  const profile = await db.companionProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  return profile?.id ?? null;
}

// ---------- Elders ----------

/** Owning family and admins can view an elder profile in full. */
export async function canViewElder(user: User, elderId: string): Promise<ElderProfile | null> {
  if (user.role === "ADMIN") {
    return db.elderProfile.findUnique({ where: { id: elderId } });
  }
  const profileId = await familyProfileId(user);
  if (!profileId) return null;
  return db.elderProfile.findFirst({ where: { id: elderId, familyId: profileId } });
}

/** Only the owning family may edit an elder profile. */
export async function canEditElder(user: User, elderId: string): Promise<ElderProfile | null> {
  const profileId = await familyProfileId(user);
  if (!profileId) return null;
  return db.elderProfile.findFirst({ where: { id: elderId, familyId: profileId } });
}

// ---------- Bookings ----------

/** Owning family, the assigned companion, and admins can view a booking. */
export async function canViewBooking(user: User, bookingId: string): Promise<Booking | null> {
  if (user.role === "ADMIN") {
    return db.booking.findUnique({ where: { id: bookingId } });
  }
  if (user.role === "FAMILY") {
    const profileId = await familyProfileId(user);
    if (!profileId) return null;
    return db.booking.findFirst({ where: { id: bookingId, familyId: profileId } });
  }
  const companionId = await companionProfileId(user);
  if (!companionId) return null;
  return db.booking.findFirst({
    where: { id: bookingId, assignment: { companionId, status: { in: ["PENDING", "ACCEPTED"] } } },
  });
}

/** Managing (cancel, pay, review): owning family or admin — not companions. */
export async function canManageBooking(user: User, bookingId: string): Promise<Booking | null> {
  if (user.role === "ADMIN") {
    return db.booking.findUnique({ where: { id: bookingId } });
  }
  const profileId = await familyProfileId(user);
  if (!profileId) return null;
  return db.booking.findFirst({ where: { id: bookingId, familyId: profileId } });
}

// ---------- Visit reports ----------

/** Family (owner), assigned companion, and admins can read a report. */
export async function canViewVisitReport(
  user: User,
  reportId: string,
): Promise<VisitReport | null> {
  const report = await db.visitReport.findUnique({
    where: { id: reportId },
    include: { visit: { select: { bookingId: true } } },
  });
  if (!report) return null;
  const booking = await canViewBooking(user, report.visit.bookingId);
  return booking ? report : null;
}

/** Only the owning family acknowledges a report. */
export async function canAcknowledgeVisitReport(
  user: User,
  reportId: string,
): Promise<VisitReport | null> {
  const profileId = await familyProfileId(user);
  if (!profileId) return null;
  return db.visitReport.findFirst({
    where: { id: reportId, visit: { booking: { familyId: profileId } } },
  });
}

// ---------- Messaging ----------

/**
 * Admins see every thread; a family sees threads of their bookings and their
 * own support thread; a companion sees threads of bookings assigned to them
 * and their own support thread.
 */
export async function canMessageInThread(user: User, thread: MessageThread): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (thread.supportUserId) return thread.supportUserId === user.id;
  if (!thread.bookingId) return false;
  return Boolean(await canViewBooking(user, thread.bookingId));
}

// ---------- Files ----------

/**
 * Sensitive documents (verification papers): the owner and admins only.
 * Visit photos / attachments follow the underlying booking's visibility.
 */
export async function canViewSensitiveDocument(
  user: User,
  file: StoredFile,
): Promise<boolean> {
  if (file.status !== "AVAILABLE") {
    // Quarantined/pending/deleted files are visible to admins only.
    return user.role === "ADMIN";
  }
  if (user.role === "ADMIN") return true;
  return file.ownerUserId === user.id;
}

// ---------- Admin capabilities ----------

export function canManageCompanionVerification(user: User): boolean {
  return user.role === "ADMIN";
}

export function canManageSOS(user: User): boolean {
  return user.role === "ADMIN";
}
