import { describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { createElder } from "@/lib/actions/elders";
import { createBooking, payBooking, submitReview } from "@/lib/actions/bookings";
import { assignCompanion, updatePaymentStatus } from "@/lib/actions/admin";
import { completeVisit, respondToAssignment, startVisit, submitVisitReport } from "@/lib/actions/companion";
import {
  createAndLogin,
  createElderFor,
  createService,
  formData,
  loginAs,
  tomorrow,
  verifyCompanion,
} from "./helpers";

describe("elder profiles", () => {
  it("family can create an elder profile with consent", async () => {
    const family = await createAndLogin("FAMILY");
    await expect(
      createElder(undefined, formData({
        fullName: "Hajurbuwa Test",
        addressLine: "Ring Road 5",
        city: "Kathmandu",
        preferredLanguage: "ne",
        consentToShare: "on",
      })),
    ).rejects.toThrow(/REDIRECT:/);

    const elder = await db.elderProfile.findFirst({
      where: { familyId: family.familyProfile!.id },
    });
    expect(elder?.fullName).toBe("Hajurbuwa Test");
    // High-entropy, unambiguous-alphabet access code.
    expect(elder?.elderAccessCode).toMatch(/^SAHARA-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("rejects elder creation without consent", async () => {
    await createAndLogin("FAMILY");
    const result = await createElder(undefined, formData({
      fullName: "No Consent",
      addressLine: "Somewhere 2",
      city: "Pokhara",
      preferredLanguage: "ne",
    }));
    expect(result?.error).toMatch(/consent/i);
  });
});

describe("full booking lifecycle", () => {
  it("request → assign → accept → start → complete → report → review → payment", async () => {
    // --- Family requests a booking
    const family = await createAndLogin("FAMILY", "Booking Family");
    const elder = await createElderFor(family.familyProfile!.id);
    const service = await createService("Lifecycle Service");

    await expect(
      createBooking(undefined, formData({
        elderId: elder.id,
        serviceIds: [service.id],
        date: tomorrow(),
        time: "10:00",
        durationMin: "60",
        instructions: "Test instructions",
        paymentMethod: "ESEWA",
        idempotencyKey: randomUUID(),
      })),
    ).rejects.toThrow(/REDIRECT:/);

    const booking = await db.booking.findFirst({
      where: { elderId: elder.id },
      include: { payment: true, services: true, thread: true },
    });
    expect(booking).not.toBeNull();
    expect(booking!.status).toBe("AWAITING_ASSIGNMENT");
    expect(booking!.estimatedNpr).toBe(1000);
    expect(booking!.payment?.status).toBe("PENDING");
    expect(booking!.thread).not.toBeNull();

    // --- Family pays (demo provider)
    const payResult = await payBooking(undefined, formData({
      bookingId: booking!.id,
      method: "ESEWA",
    }));
    expect(payResult?.error).toBeUndefined();
    expect((await db.payment.findUnique({ where: { bookingId: booking!.id } }))?.status).toBe("PAID");

    // --- Admin assigns a verified companion
    const companionUser = await createAndLogin("COMPANION", "Lifecycle Companion");
    await verifyCompanion(companionUser.companionProfile!.id);

    const admin = await createAndLogin("ADMIN");
    const assignResult = await assignCompanion(undefined, formData({
      bookingId: booking!.id,
      companionId: companionUser.companionProfile!.id,
    }));
    expect(assignResult?.error).toBeUndefined();
    expect((await db.booking.findUnique({ where: { id: booking!.id } }))!.status).toBe("COMPANION_ASSIGNED");

    // --- Unverified companions can't be assigned
    const unverified = await createAndLogin("COMPANION", "Unverified");
    await loginAs(admin.id, "ADMIN");
    const badAssign = await assignCompanion(undefined, formData({
      bookingId: booking!.id,
      companionId: unverified.companionProfile!.id,
    }));
    expect(badAssign?.error).toMatch(/verified/i);

    // --- Companion accepts
    await loginAs(companionUser.id, "COMPANION");
    const assignment = await db.companionAssignment.findUnique({ where: { bookingId: booking!.id } });
    const acceptResult = await respondToAssignment(undefined, formData({
      assignmentId: assignment!.id,
      response: "accept",
    }));
    expect(acceptResult?.error).toBeUndefined();
    expect((await db.booking.findUnique({ where: { id: booking!.id } }))!.status).toBe("CONFIRMED");

    // --- Start and complete the visit
    expect((await startVisit(undefined, formData({ bookingId: booking!.id })))?.error).toBeUndefined();
    expect((await db.booking.findUnique({ where: { id: booking!.id } }))!.status).toBe("IN_PROGRESS");

    expect((await completeVisit(undefined, formData({ bookingId: booking!.id })))?.error).toBeUndefined();
    expect((await db.booking.findUnique({ where: { id: booking!.id } }))!.status).toBe("COMPLETED");

    // --- Submit the visit report (with a valid photo name)
    await expect(
      submitVisitReport(undefined, formData({
        bookingId: booking!.id,
        tasksCompleted: "Everything on the list",
        wellbeingNote: "Cheerful and well",
        photoNames: "tea.jpg, garden.png",
      })),
    ).rejects.toThrow(/REDIRECT:/);

    const report = await db.visitReport.findFirst({
      where: { visit: { bookingId: booking!.id } },
      include: { photos: true },
    });
    expect(report).not.toBeNull();
    expect(report!.photos).toHaveLength(2);

    // --- Family reviews the visit
    await loginAs(family.id, "FAMILY");
    const reviewResult = await submitReview(undefined, formData({
      bookingId: booking!.id,
      rating: "5",
      comment: "Wonderful visit",
    }));
    expect(reviewResult?.error).toBeUndefined();
    expect((await db.review.findUnique({ where: { bookingId: booking!.id } }))?.rating).toBe(5);

    // --- Admin updates payment status
    await loginAs(admin.id, "ADMIN");
    const payment = await db.payment.findUnique({ where: { bookingId: booking!.id } });
    const statusResult = await updatePaymentStatus(undefined, formData({
      paymentId: payment!.id,
      status: "REFUNDED",
      reason: "Family requested a refund after cancellation",
    }));
    expect(statusResult?.error).toBeUndefined();
    expect((await db.payment.findUnique({ where: { id: payment!.id } }))!.status).toBe("REFUNDED");
  });

  it("rejects an unsafe photo file name in reports", async () => {
    const family = await createAndLogin("FAMILY");
    const elder = await createElderFor(family.familyProfile!.id);
    const service = await createService();
    const companionUser = await createAndLogin("COMPANION");
    await verifyCompanion(companionUser.companionProfile!.id);

    // Build a completed visit directly.
    const booking = await db.booking.create({
      data: {
        code: `SB-TEST-${Date.now()}`,
        familyId: family.familyProfile!.id,
        elderId: elder.id,
        status: "COMPLETED",
        requestedDate: new Date(),
        requestedTime: "10:00",
        estimatedNpr: 1000,
        services: { create: [{ serviceId: service.id, priceNpr: 1000 }] },
        assignment: {
          create: { companionId: companionUser.companionProfile!.id, status: "ACCEPTED" },
        },
        visit: { create: { status: "COMPLETED", completedAt: new Date() } },
      },
    });

    const result = await submitVisitReport(undefined, formData({
      bookingId: booking.id,
      tasksCompleted: "Tasks",
      wellbeingNote: "Fine",
      photoNames: "evil.exe",
    }));
    expect(result?.error).toMatch(/image/i);
  });
});
