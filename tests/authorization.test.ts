import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  canEditElder,
  canManageBooking,
  canMessageInThread,
  canViewBooking,
  canViewSensitiveDocument,
} from "@/lib/policies";
import { updateElder } from "@/lib/actions/elders";
import { cancelBooking } from "@/lib/actions/bookings";
import { resetRateLimits } from "@/lib/rate-limit";
import { __clearCookies } from "next/headers";
import { createAndLogin, createElderFor, createService, formData } from "./helpers";

beforeEach(() => {
  resetRateLimits();
  __clearCookies();
});

async function makeBookingFor(familyProfileId: string, elderId: string, serviceId: string) {
  return db.booking.create({
    data: {
      code: `SB-AUTH-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      familyId: familyProfileId,
      elderId,
      status: "AWAITING_ASSIGNMENT",
      requestedDate: new Date(),
      requestedTime: "10:00",
      estimatedNpr: 1000,
      services: { create: [{ serviceId, priceNpr: 1000 }] },
      thread: { create: { subject: "authz test" } },
    },
    include: { thread: true },
  });
}

describe("IDOR protection — elders", () => {
  it("another family cannot see or edit someone else's elder", async () => {
    const familyA = await createAndLogin("FAMILY", "Family A");
    const elder = await createElderFor(familyA.familyProfile!.id, "Protected Elder");

    __clearCookies();
    const familyB = await createAndLogin("FAMILY", "Family B");

    expect(await canEditElder(familyB, elder.id)).toBeNull();

    // The mutation path fails closed with a not-found response.
    const result = await updateElder(undefined, formData({
      elderId: elder.id,
      fullName: "Hijacked Name",
      addressLine: "Elsewhere 1",
      city: "Pokhara",
      preferredLanguage: "ne",
      consentToShare: "on",
    }));
    expect(result?.error).toMatch(/not found/i);
    const untouched = await db.elderProfile.findUnique({ where: { id: elder.id } });
    expect(untouched!.fullName).toBe("Protected Elder");
  });
});

describe("IDOR protection — bookings", () => {
  it("family B cannot view or cancel family A's booking; admin can view", async () => {
    const familyA = await createAndLogin("FAMILY", "Family A");
    const elder = await createElderFor(familyA.familyProfile!.id);
    const service = await createService();
    const booking = await makeBookingFor(familyA.familyProfile!.id, elder.id, service.id);

    __clearCookies();
    const familyB = await createAndLogin("FAMILY", "Family B");
    expect(await canViewBooking(familyB, booking.id)).toBeNull();
    expect(await canManageBooking(familyB, booking.id)).toBeNull();

    const cancelResult = await cancelBooking(undefined, formData({
      bookingId: booking.id,
      reason: "malicious",
    }));
    expect(cancelResult?.error).toMatch(/not found/i);
    expect(
      (await db.booking.findUnique({ where: { id: booking.id } }))!.status,
    ).toBe("AWAITING_ASSIGNMENT");

    __clearCookies();
    const admin = await createAndLogin("ADMIN");
    expect(await canViewBooking(admin, booking.id)).not.toBeNull();
  });

  it("a companion sees a booking only when assigned to it", async () => {
    const family = await createAndLogin("FAMILY");
    const elder = await createElderFor(family.familyProfile!.id);
    const service = await createService();
    const booking = await makeBookingFor(family.familyProfile!.id, elder.id, service.id);

    __clearCookies();
    const companion = await createAndLogin("COMPANION", "Unassigned Companion");
    expect(await canViewBooking(companion, booking.id)).toBeNull();
    expect(await canMessageInThread(companion, booking.thread!)).toBe(false);

    await db.companionAssignment.create({
      data: {
        bookingId: booking.id,
        companionId: companion.companionProfile!.id,
        status: "ACCEPTED",
      },
    });
    expect(await canViewBooking(companion, booking.id)).not.toBeNull();
    expect(await canMessageInThread(companion, booking.thread!)).toBe(true);
  });
});

describe("sensitive documents", () => {
  it("only the owner and admins may access a verification document", async () => {
    const owner = await createAndLogin("COMPANION", "Doc Owner");
    const file = await db.storedFile.create({
      data: {
        kind: "VERIFICATION_DOCUMENT",
        status: "AVAILABLE",
        ownerUserId: owner.id,
        storageKey: `verification/test-${Date.now()}`,
        originalName: "citizenship.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        sha256: "0".repeat(64),
      },
    });

    expect(await canViewSensitiveDocument(owner, file)).toBe(true);

    __clearCookies();
    const otherCompanion = await createAndLogin("COMPANION", "Other");
    expect(await canViewSensitiveDocument(otherCompanion, file)).toBe(false);

    __clearCookies();
    const family = await createAndLogin("FAMILY");
    expect(await canViewSensitiveDocument(family, file)).toBe(false);

    __clearCookies();
    const admin = await createAndLogin("ADMIN");
    expect(await canViewSensitiveDocument(admin, file)).toBe(true);

    // Quarantined files: admin-only, even for the owner.
    const quarantined = { ...file, status: "QUARANTINED" as const };
    expect(await canViewSensitiveDocument(owner, quarantined)).toBe(false);
    expect(await canViewSensitiveDocument(admin, quarantined)).toBe(true);
  });
});

describe("admin overrides require a reason", () => {
  it("rejects a booking status override without a reason", async () => {
    const family = await createAndLogin("FAMILY");
    const elder = await createElderFor(family.familyProfile!.id);
    const service = await createService();
    const booking = await makeBookingFor(family.familyProfile!.id, elder.id, service.id);

    __clearCookies();
    await createAndLogin("ADMIN");
    const { updateBookingStatus } = await import("@/lib/actions/admin");
    const noReason = await updateBookingStatus(undefined, formData({
      bookingId: booking.id,
      status: "DISPUTED",
    }));
    expect(noReason?.error).toMatch(/reason/i);

    const withReason = await updateBookingStatus(undefined, formData({
      bookingId: booking.id,
      status: "DISPUTED",
      reason: "Family raised a billing dispute by phone",
    }));
    expect(withReason?.error).toBeUndefined();
    const audit = await db.auditLog.findFirst({
      where: { action: "booking.status.override", entity: `Booking:${booking.id}` },
    });
    expect(audit?.detail).toContain("billing dispute");
  });
});
