"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { notify, notifyAdmins } from "@/lib/notify";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

async function elderScreenIp(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  } catch {
    return "local";
  }
}

/**
 * Data for the elder-friendly screen, looked up by access code only —
 * elders don't log in. Returns the minimum needed for the screen.
 */
export async function lookupElderScreen(accessCode: string) {
  const code = accessCode.trim().toUpperCase();
  if (!code) return null;

  // Access codes are guessable in principle; throttle lookups per IP so the
  // code space cannot be enumerated. Failures and successes respond alike.
  if (!checkRateLimit(`elder-lookup:${await elderScreenIp()}`, RATE_LIMITS.elderLookup)) {
    return null;
  }

  const elder = await db.elderProfile.findUnique({
    where: { elderAccessCode: code },
    include: {
      family: { include: { user: true } },
      emergencyContacts: { orderBy: { isPrimary: "desc" } },
    },
  });
  if (!elder) return null;

  const [nextBooking, recentCompleted] = await Promise.all([
    db.booking.findFirst({
      where: {
        elderId: elder.id,
        status: { in: ["COMPANION_ASSIGNED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        requestedDate: { gte: new Date(new Date().toDateString()) },
      },
      include: {
        services: { include: { service: true } },
        assignment: { include: { companion: { include: { user: true } } } },
      },
      orderBy: { requestedDate: "asc" },
    }),
    db.booking.findFirst({
      where: { elderId: elder.id, status: "COMPLETED" },
      include: { assignment: { include: { companion: { include: { user: true } } } } },
      orderBy: { requestedDate: "desc" },
    }),
  ]);

  return {
    elderName: elder.nickname || elder.fullName,
    preferredLanguage: elder.preferredLanguage as "ne" | "en",
    // Phone the elder can tap to reach family: prefer their family member
    // abroad, falling back to the primary emergency contact.
    familyPhone:
      elder.family.user.phone ??
      elder.emergencyContacts.find((c) => c.phone)?.phone ??
      null,
    nextVisit: nextBooking
      ? {
          bookingId: nextBooking.id,
          date: nextBooking.requestedDate.toISOString(),
          time: nextBooking.requestedTime,
          services: nextBooking.services.map((s) => `${s.service.icon} ${s.service.name}`),
          servicesNe: nextBooking.services.map(
            (s) => `${s.service.icon} ${s.service.nameNe ?? s.service.name}`,
          ),
          companionName:
            nextBooking.assignment?.status === "ACCEPTED"
              ? nextBooking.assignment.companion.user.name
              : null,
          inProgress: nextBooking.status === "IN_PROGRESS",
        }
      : null,
    recentCompleted: recentCompleted
      ? {
          bookingId: recentCompleted.id,
          date: recentCompleted.requestedDate.toISOString(),
          companionName: recentCompleted.assignment?.companion.user.name ?? null,
        }
      : null,
  };
}

/** Elder taps “Yes, the visit happened” — informs family and साहारा. */
export async function elderConfirmVisit(accessCode: string, bookingId: string): Promise<boolean> {
  const code = accessCode.trim().toUpperCase();
  const elder = await db.elderProfile.findUnique({
    where: { elderAccessCode: code },
    include: { family: { include: { user: true } } },
  });
  if (!elder) return false;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, elderId: elder.id, status: "COMPLETED" },
  });
  if (!booking) return false;

  await notify(
    elder.family.user.id,
    "VISIT",
    `${elder.fullName} confirmed the visit ✓`,
    `They tapped “the visit happened” on the elder screen for ${booking.code}.`,
    `/family/bookings/${booking.id}`,
  );
  await notifyAdmins("VISIT", `Elder confirmed visit ${booking.code}`, elder.fullName);
  return true;
}
