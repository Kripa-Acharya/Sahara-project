import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import type { Role } from "@prisma/client";

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.sahara`;
}

/** Create a user of a role (with matching profile) and log them in. */
export async function createAndLogin(role: Role, name = "Test User") {
  const user = await db.user.create({
    data: {
      email: uniqueEmail(role.toLowerCase()),
      passwordHash: hashPassword("Password@123"),
      name,
      phone: "+977-98-0000-0000",
      role,
      ...(role === "FAMILY" ? { familyProfile: { create: {} } } : {}),
      ...(role === "COMPANION"
        ? { companionProfile: { create: { verification: { create: {} } } } }
        : {}),
    },
    include: { familyProfile: true, companionProfile: { include: { verification: true } } },
  });
  await createSession(user.id);
  return user;
}

// Role is derived server-side from the user row; parameter kept for test
// readability at call sites.
export async function loginAs(userId: string, role?: Role) {
  void role;
  await createSession(userId);
}

export async function logoutTestUser() {
  await destroySession();
}

/** Create an elder attached to a family profile. */
export async function createElderFor(familyId: string, fullName = "Test Elder") {
  return db.elderProfile.create({
    data: {
      familyId,
      fullName,
      addressLine: "Test Street 1",
      city: "Kathmandu",
      consentToShare: true,
      elderAccessCode: `TEST${Date.now() % 100000}${counter}`,
    },
  });
}

/** Create an active service. */
export async function createService(name = "Test Service") {
  counter += 1;
  return db.service.create({
    data: {
      slug: `test-service-${Date.now()}-${counter}`,
      name,
      description: "A test service",
      icon: "🧪",
      estimatedMinutes: 60,
      basePriceNpr: 1000,
    },
  });
}

/** Mark a companion's verification as fully VERIFIED. */
export async function verifyCompanion(companionProfileId: string) {
  await db.companionVerification.update({
    where: { companionId: companionProfileId },
    data: {
      status: "VERIFIED",
      idSubmitted: true,
      policeReportSubmitted: true,
      referencesChecked: true,
      phoneVerified: true,
      addressVerified: true,
      interviewCompleted: true,
      orientationCompleted: true,
      skillsReviewed: true,
      emergencyTrainingDone: true,
      finalApproval: true,
    },
  });
}

export function formData(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, v));
    else fd.set(key, value);
  }
  return fd;
}

/** Tomorrow's date as YYYY-MM-DD. */
export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0]!;
}
