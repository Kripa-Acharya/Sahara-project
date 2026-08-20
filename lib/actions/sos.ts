"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCompanion } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { notify, notifyAdmins } from "@/lib/notify";
import type { FormState } from "@/lib/actions/auth";

/** Companion raises an SOS during a visit. */
export async function raiseCompanionSos(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireCompanion();
  const bookingId = String(formData.get("bookingId") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  const booking = await db.booking.findFirst({
    where: { id: bookingId, assignment: { companionId: profile.id } },
    include: { elder: { include: { family: { include: { user: true } } } } },
  });
  if (!booking) return { error: "Booking not found." };

  const alert = await db.emergencyAlert.create({
    data: {
      elderId: booking.elderId,
      bookingId: booking.id,
      raisedBy: "companion",
      locationText: `${booking.elder.addressLine}, ${booking.elder.city}`,
      description: description || `SOS raised by companion ${user.name} during visit ${booking.code}.`,
    },
  });
  // Operational alerting hook: SOS events are always logged at critical.
  logger.critical("SOS raised", { alertId: alert.id, raisedBy: "companion" });

  await notifyAdmins(
    "EMERGENCY",
    `🆘 SOS from companion — ${booking.elder.fullName}`,
    description || `Raised during visit ${booking.code}.`,
    "/admin/emergencies",
  );
  await notify(
    booking.elder.family.user.id,
    "EMERGENCY",
    `🆘 Emergency alert for ${booking.elder.fullName}`,
    description || "The companion raised an SOS during the visit. साहारा support has been alerted.",
    "/family",
  );

  revalidatePath(`/companion/visits/${booking.id}`);
  return {};
}

/**
 * Elder raises an SOS from the elder-friendly screen (identified by access code,
 * no login required).
 */
export async function raiseElderSos(_prev: FormState, formData: FormData): Promise<FormState> {
  // Generous per-IP limit: blocks code-guessing abuse without ever getting in
  // the way of a genuine repeated emergency press.
  const { checkRateLimit, RATE_LIMITS } = await import("@/lib/rate-limit");
  const { headers } = await import("next/headers");
  const ip = await headers()
    .then((h) => h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local")
    .catch(() => "local");
  if (!checkRateLimit(`sos:${ip}`, RATE_LIMITS.sos)) {
    return { error: "not-found" };
  }

  const accessCode = String(formData.get("accessCode") ?? "").trim().toUpperCase();
  const elder = await db.elderProfile.findUnique({
    where: { elderAccessCode: accessCode },
    include: { family: { include: { user: true } } },
  });
  if (!elder) return { error: "not-found" };

  // Attach the alert to today's booking if one is active.
  const activeBooking = await db.booking.findFirst({
    where: { elderId: elder.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    orderBy: { requestedDate: "asc" },
  });

  const alert = await db.emergencyAlert.create({
    data: {
      elderId: elder.id,
      bookingId: activeBooking?.id ?? null,
      raisedBy: "elder",
      locationText: `${elder.addressLine}, ${elder.city}`,
      description: "SOS pressed on the elder screen.",
    },
  });
  // Operational alerting hook: SOS events are always logged at critical.
  logger.critical("SOS raised", { alertId: alert.id, raisedBy: "elder" });

  await notifyAdmins(
    "EMERGENCY",
    `🆘 SOS from elder — ${elder.fullName}`,
    `${elder.addressLine}, ${elder.city}`,
    "/admin/emergencies",
  );
  await notify(
    elder.family.user.id,
    "EMERGENCY",
    `🆘 ${elder.fullName} pressed the SOS button`,
    "साहारा support has been alerted. Please try calling your loved one.",
    "/family",
  );

  return {};
}
