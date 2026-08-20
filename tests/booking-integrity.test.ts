import { describe, expect, it, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { createBooking } from "@/lib/actions/bookings";
import { assignCompanion } from "@/lib/actions/admin";
import { resetRateLimits } from "@/lib/rate-limit";
import { __clearCookies } from "next/headers";
import {
  createAndLogin,
  createElderFor,
  createService,
  formData,
  loginAs,
  tomorrow,
  verifyCompanion,
} from "./helpers";

beforeEach(() => {
  resetRateLimits();
  __clearCookies();
});

describe("booking idempotency", () => {
  it("the same idempotency key creates exactly one booking", async () => {
    const family = await createAndLogin("FAMILY");
    const elder = await createElderFor(family.familyProfile!.id);
    const service = await createService();
    const key = randomUUID();

    const payload = {
      elderId: elder.id,
      serviceIds: [service.id],
      date: tomorrow(),
      time: "10:00",
      durationMin: "60",
      paymentMethod: "ESEWA",
      idempotencyKey: key,
    };

    await expect(createBooking(undefined, formData(payload))).rejects.toThrow(/REDIRECT/);
    // Retry (double click / network replay) redirects to the same booking.
    await expect(createBooking(undefined, formData(payload))).rejects.toThrow(/REDIRECT/);

    const bookings = await db.booking.findMany({ where: { idempotencyKey: key } });
    expect(bookings).toHaveLength(1);
    const total = await db.booking.count({ where: { elderId: elder.id } });
    expect(total).toBe(1);
  });
});

describe("assignment overlap protection", () => {
  it("rejects assigning a companion to two overlapping visits", async () => {
    const family = await createAndLogin("FAMILY");
    const elder = await createElderFor(family.familyProfile!.id);
    const service = await createService();
    const companion = await createAndLogin("COMPANION", "Busy Companion");
    await verifyCompanion(companion.companionProfile!.id);
    const admin = await createAndLogin("ADMIN");

    const date = new Date(`${tomorrow()}T00:00:00Z`);
    const mk = (code: string, time: string, durationMin: number) =>
      db.booking.create({
        data: {
          code,
          familyId: family.familyProfile!.id,
          elderId: elder.id,
          status: "AWAITING_ASSIGNMENT",
          requestedDate: date,
          requestedTime: time,
          durationMin,
          estimatedNpr: 1000,
          services: { create: [{ serviceId: service.id, priceNpr: 1000 }] },
        },
      });

    const first = await mk(`SB-OV1-${Date.now()}`, "10:00", 120); // 10:00–12:00
    const overlapping = await mk(`SB-OV2-${Date.now()}`, "11:00", 60); // 11:00–12:00
    const adjacent = await mk(`SB-OV3-${Date.now()}`, "12:00", 60); // 12:00–13:00

    await loginAs(admin.id);
    const ok = await assignCompanion(undefined, formData({
      bookingId: first.id,
      companionId: companion.companionProfile!.id,
    }));
    expect(ok?.error).toBeUndefined();

    const conflict = await assignCompanion(undefined, formData({
      bookingId: overlapping.id,
      companionId: companion.companionProfile!.id,
    }));
    expect(conflict?.error).toMatch(/overlapping/i);

    // Back-to-back is allowed (12:00 start does not overlap a 12:00 end).
    const backToBack = await assignCompanion(undefined, formData({
      bookingId: adjacent.id,
      companionId: companion.companionProfile!.id,
    }));
    expect(backToBack?.error).toBeUndefined();
  });
});
