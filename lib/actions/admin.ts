"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { nextBookingCode } from "@/lib/booking-code";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import type { FormState } from "@/lib/actions/auth";
import type {
  BookingStatus,
  IncidentStatus,
  PaymentStatus,
  VerificationStatus,
} from "@prisma/client";

// ---------- Booking management ----------

/** Assign (or reassign) a verified companion to a booking. */
export async function assignCompanion(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const bookingId = String(formData.get("bookingId") ?? "");
  const companionId = String(formData.get("companionId") ?? "");
  if (!companionId) return { error: "Please choose a companion." };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { assignment: true, elder: true },
  });
  if (!booking) return { error: "Booking not found." };
  if (["COMPLETED", "CANCELLED", "IN_PROGRESS"].includes(booking.status)) {
    return { error: "This booking can no longer be reassigned." };
  }

  const companion = await db.companionProfile.findUnique({
    where: { id: companionId },
    include: { user: true, verification: true },
  });
  if (!companion) return { error: "Companion not found." };
  if (companion.verification?.status !== "VERIFIED") {
    return { error: "Only verified companions can be assigned." };
  }

  // A companion cannot hold two overlapping active visits on the same day.
  const sameDay = await db.booking.findMany({
    where: {
      id: { not: booking.id },
      requestedDate: booking.requestedDate,
      status: { in: ["COMPANION_ASSIGNED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
      assignment: { companionId: companion.id, status: { in: ["PENDING", "ACCEPTED"] } },
    },
    select: { code: true, requestedTime: true, durationMin: true },
  });
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const start = toMinutes(booking.requestedTime);
  const end = start + booking.durationMin;
  const conflict = sameDay.find((other) => {
    const otherStart = toMinutes(other.requestedTime);
    const otherEnd = otherStart + other.durationMin;
    return start < otherEnd && otherStart < end;
  });
  if (conflict) {
    return {
      error: `${companion.user.name} already has visit ${conflict.code} at an overlapping time. Choose another companion or time.`,
    };
  }

  await db.$transaction([
    // Replace any previous assignment (e.g. after a rejection).
    ...(booking.assignment
      ? [db.companionAssignment.delete({ where: { id: booking.assignment.id } })]
      : []),
    db.companionAssignment.create({
      data: {
        bookingId: booking.id,
        companionId: companion.id,
        status: "PENDING",
        assignedById: admin.id,
      },
    }),
    db.booking.update({ where: { id: booking.id }, data: { status: "COMPANION_ASSIGNED" } }),
  ]);

  await notify(
    companion.user.id,
    "BOOKING",
    `New visit request — ${booking.code}`,
    `${booking.elder.city} · please accept or decline.`,
    `/companion/visits/${booking.id}`,
  );
  await logAudit(admin.id, "booking.assign", `Booking:${booking.id}`, `Assigned ${companion.user.name}`);

  revalidatePath(`/admin/bookings/${booking.id}`);
  revalidatePath("/admin/bookings");
  return {};
}

const bookingStatuses: BookingStatus[] = [
  "DRAFT", "REQUESTED", "AWAITING_ASSIGNMENT", "COMPANION_ASSIGNED", "ACCEPTED",
  "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED",
];

export async function updateBookingStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!bookingStatuses.includes(status)) return { error: "Invalid status." };
  if (reason.length < 5) {
    return { error: "Please give a short reason — status overrides are audit-logged." };
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: "Booking not found." };
  if (booking.status === status) return { error: "The booking already has this status." };

  await db.booking.update({ where: { id: booking.id }, data: { status } });
  await logAudit(
    admin.id,
    "booking.status.override",
    `Booking:${booking.id}`,
    `${booking.status} → ${status} · reason: ${reason}`,
  );
  revalidatePath(`/admin/bookings/${booking.id}`);
  revalidatePath("/admin/bookings");
  return {};
}

const paymentStatuses: PaymentStatus[] = [
  "PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "CASH_DUE", "CASH_RECEIVED",
];

export async function updatePaymentStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const paymentId = String(formData.get("paymentId") ?? "");
  const status = String(formData.get("status") ?? "") as PaymentStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!paymentStatuses.includes(status)) return { error: "Invalid status." };
  if (reason.length < 5) {
    return { error: "Please give a short reason — payment overrides are audit-logged." };
  }

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) return { error: "Payment not found." };
  if (payment.status === status) return { error: "The payment already has this status." };

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status,
      paidAt: ["PAID", "CASH_RECEIVED"].includes(status) ? (payment.paidAt ?? new Date()) : payment.paidAt,
    },
  });
  await logAudit(
    admin.id,
    "payment.status.override",
    `Payment:${payment.id}`,
    `${payment.status} → ${status} (${payment.booking.code}) · reason: ${reason}`,
  );
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/bookings/${payment.bookingId}`);
  return {};
}

// ---------- Companion verification ----------

const checklistKeys = [
  "idSubmitted", "policeReportSubmitted", "referencesChecked", "phoneVerified",
  "addressVerified", "interviewCompleted", "orientationCompleted", "skillsReviewed",
  "emergencyTrainingDone", "finalApproval",
] as const;

const verificationStatuses: VerificationStatus[] = [
  "INCOMPLETE", "UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED",
];

/** Update the whole verification checklist + status for a companion. */
export async function updateVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const companionId = String(formData.get("companionId") ?? "");
  const status = String(formData.get("status") ?? "") as VerificationStatus;
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();
  if (!verificationStatuses.includes(status)) return { error: "Invalid status." };

  const companion = await db.companionProfile.findUnique({
    where: { id: companionId },
    include: { user: true, verification: true },
  });
  if (!companion || !companion.verification) return { error: "Companion not found." };

  const checklist = Object.fromEntries(
    checklistKeys.map((key) => [key, formData.get(key) === "on"]),
  );

  if (status === "VERIFIED" && !checklist.finalApproval) {
    return { error: "Grant final approval before marking a companion as Verified." };
  }

  await db.companionVerification.update({
    where: { id: companion.verification.id },
    data: { ...checklist, status, adminNotes: adminNotes || null, reviewedAt: new Date() },
  });

  const statusChanged = companion.verification.status !== status;
  if (statusChanged) {
    const messages: Partial<Record<VerificationStatus, string>> = {
      VERIFIED: "Congratulations! You are now a Verified Companion and can accept visits.",
      REJECTED: "Unfortunately your application was not approved. Contact साहारा support for details.",
      SUSPENDED: "Your companion account has been suspended. Contact साहारा support.",
      UNDER_REVIEW: "Your application is now under review.",
    };
    const message = messages[status];
    if (message) {
      await notify(companion.user.id, "SYSTEM", "Verification update", message, "/companion/verification");
    }
  }
  await logAudit(
    admin.id,
    "companion.verification",
    `CompanionProfile:${companion.id}`,
    `Status: ${status}`,
  );

  revalidatePath(`/admin/companions/${companion.id}`);
  revalidatePath("/admin/companions");
  return {};
}

// ---------- Phone booking ----------

const phoneBookingSchema = z.object({
  elderId: z.string().optional(),
  newElderName: z.string().trim().optional(),
  newElderAddress: z.string().trim().optional(),
  newElderCity: z.string().trim().optional(),
  familyEmail: z.string().trim().toLowerCase().optional(),
  callerName: z.string().trim().min(2, "Please record the caller's name."),
  callerPhone: z.string().trim().min(7, "Please record the caller's phone number."),
  serviceIds: z.array(z.string()).min(1, "Please choose at least one service."),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Please choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a time."),
  instructions: z.string().trim().max(2000).optional(),
  paymentChoice: z.enum(["CASH", "FAMILY"]),
  companionId: z.string().optional(),
});

/** Create a booking taken over the phone; optionally creates the elder first. */
export async function createPhoneBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = phoneBookingSchema.safeParse({
    elderId: formData.get("elderId") || undefined,
    newElderName: formData.get("newElderName") || undefined,
    newElderAddress: formData.get("newElderAddress") || undefined,
    newElderCity: formData.get("newElderCity") || undefined,
    familyEmail: formData.get("familyEmail") || undefined,
    callerName: formData.get("callerName"),
    callerPhone: formData.get("callerPhone"),
    serviceIds: formData.getAll("serviceIds").map(String),
    date: formData.get("date"),
    time: formData.get("time"),
    instructions: formData.get("instructions"),
    paymentChoice: formData.get("paymentChoice"),
    companionId: formData.get("companionId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  // Resolve or create the elder.
  let elderId = data.elderId;
  if (!elderId) {
    if (!data.newElderName || !data.newElderAddress || !data.newElderCity) {
      return { error: "Choose an existing elder or fill in the new elder's name, address, and city." };
    }
    // A phone-booked elder needs a family account to attach to; use the caller's
    // family account if the email matches, otherwise fall back to a साहारा-managed
    // placeholder family (created on demand).
    let family = data.familyEmail
      ? (
          await db.user.findUnique({
            where: { email: data.familyEmail },
            include: { familyProfile: true },
          })
        )?.familyProfile ?? null
      : null;
    if (!family) {
      const placeholderEmail = "phone-bookings@sahara.demo";
      const existingPlaceholder = await db.user.findUnique({
        where: { email: placeholderEmail },
        include: { familyProfile: true },
      });
      family =
        existingPlaceholder?.familyProfile ??
        (
          await db.user.create({
            data: {
              email: placeholderEmail,
              // Random unusable password — this internal account is never logged into.
              passwordHash: `phone:${crypto.randomUUID()}`,
              name: "साहारा Phone Bookings",
              role: "FAMILY",
              familyProfile: { create: {} },
            },
            include: { familyProfile: true },
          })
        ).familyProfile!;
    }
    const created = await db.elderProfile.create({
      data: {
        familyId: family.id,
        fullName: data.newElderName,
        addressLine: data.newElderAddress,
        city: data.newElderCity,
        consentToShare: true, // caller consented by phone; recorded via audit log
        elderAccessCode: `SAHARA-${randomBytes(6)
          .toJSON()
          .data.map((b) => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31])
          .join("")}`,
      },
    });
    elderId = created.id;
    await logAudit(admin.id, "elder.create.phone", `ElderProfile:${created.id}`, `Caller: ${data.callerName}`);
  }

  const elder = await db.elderProfile.findUnique({
    where: { id: elderId },
    include: { family: { include: { user: true } } },
  });
  if (!elder) return { error: "Elder not found." };

  const services = await db.service.findMany({
    where: { id: { in: data.serviceIds }, isActive: true },
  });
  if (services.length === 0) return { error: "Please choose at least one service." };
  const estimatedNpr = services.reduce((sum, s) => sum + s.basePriceNpr, 0);

  const code = await nextBookingCode();
  const booking = await db.booking.create({
    data: {
      code,
      familyId: elder.familyId,
      elderId: elder.id,
      status: "AWAITING_ASSIGNMENT",
      requestedDate: new Date(`${data.date}T00:00:00Z`),
      requestedTime: data.time,
      durationMin: Math.max(60, services.reduce((sum, s) => sum + s.estimatedMinutes, 0)),
      instructions: data.instructions || null,
      estimatedNpr,
      isPhoneBooking: true,
      callerName: data.callerName,
      callerPhone: data.callerPhone,
      services: { create: services.map((s) => ({ serviceId: s.id, priceNpr: s.basePriceNpr })) },
      payment: {
        create: {
          familyId: elder.familyId,
          amountNpr: estimatedNpr,
          method: data.paymentChoice === "CASH" ? "CASH" : "INTERNATIONAL_CARD",
          status: data.paymentChoice === "CASH" ? "CASH_DUE" : "PENDING",
          provider: "demo",
        },
      },
      thread: { create: { subject: `Booking ${code} (phone)` } },
    },
  });

  // Optionally assign a companion straight away.
  if (data.companionId) {
    const companion = await db.companionProfile.findUnique({
      where: { id: data.companionId },
      include: { user: true, verification: true },
    });
    if (companion?.verification?.status === "VERIFIED") {
      await db.$transaction([
        db.companionAssignment.create({
          data: {
            bookingId: booking.id,
            companionId: companion.id,
            status: "PENDING",
            assignedById: admin.id,
          },
        }),
        db.booking.update({ where: { id: booking.id }, data: { status: "COMPANION_ASSIGNED" } }),
      ]);
      await notify(
        companion.user.id,
        "BOOKING",
        `New visit request — ${code}`,
        `${elder.city} · please accept or decline.`,
        `/companion/visits/${booking.id}`,
      );
    }
  }

  // Confirmation to the family account (skipped for the internal placeholder).
  if (elder.family.user.email !== "phone-bookings@sahara.demo") {
    await notify(
      elder.family.user.id,
      "BOOKING",
      `Phone booking created — ${code}`,
      `साहारा created this booking after a call from ${data.callerName}.`,
      `/family/bookings/${booking.id}`,
    );
  }

  await logAudit(admin.id, "booking.create.phone", `Booking:${booking.id}`, `Caller: ${data.callerName} (${data.callerPhone})`);
  revalidatePath("/admin/bookings");
  redirect(`/admin/bookings/${booking.id}`);
}

// ---------- Emergency alerts ----------

export async function acknowledgeAlert(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const alertId = String(formData.get("alertId") ?? "");
  const alert = await db.emergencyAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.status !== "ACTIVE") return;
  await db.emergencyAlert.update({
    where: { id: alert.id },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });
  await logAudit(admin.id, "alert.acknowledge", `EmergencyAlert:${alert.id}`);
  revalidatePath("/admin/emergencies");
  revalidatePath("/admin");
}

export async function resolveAlert(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const alertId = String(formData.get("alertId") ?? "");
  const resolvedNote = String(formData.get("resolvedNote") ?? "").trim();
  if (!resolvedNote) return { error: "Please describe how the alert was resolved." };

  const alert = await db.emergencyAlert.findUnique({
    where: { id: alertId },
    include: { elder: { include: { family: { include: { user: true } } } } },
  });
  if (!alert || alert.status === "RESOLVED") return { error: "Alert not found or already resolved." };

  await db.emergencyAlert.update({
    where: { id: alert.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedNote,
      acknowledgedAt: alert.acknowledgedAt ?? new Date(),
    },
  });
  await notify(
    alert.elder.family.user.id,
    "EMERGENCY",
    `Alert resolved — ${alert.elder.fullName}`,
    resolvedNote,
    "/family",
  );
  await logAudit(admin.id, "alert.resolve", `EmergencyAlert:${alert.id}`, resolvedNote);
  revalidatePath("/admin/emergencies");
  revalidatePath("/admin");
  return {};
}

// ---------- Incidents ----------

const incidentStatuses: IncidentStatus[] = ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"];

export async function updateIncident(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const incidentId = String(formData.get("incidentId") ?? "");
  const status = String(formData.get("status") ?? "") as IncidentStatus;
  const resolution = String(formData.get("resolution") ?? "").trim();
  if (!incidentStatuses.includes(status)) return { error: "Invalid status." };

  const incident = await db.incident.findUnique({ where: { id: incidentId } });
  if (!incident) return { error: "Incident not found." };

  await db.incident.update({
    where: { id: incident.id },
    data: { status, resolution: resolution || incident.resolution },
  });
  await logAudit(admin.id, "incident.update", `Incident:${incident.id}`, `Status: ${status}`);
  revalidatePath("/admin/incidents");
  return {};
}

// ---------- Services ----------

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Please enter a service name."),
  nameNe: z.string().trim().optional(),
  description: z.string().trim().min(5, "Please enter a description."),
  icon: z.string().trim().min(1, "Please enter an icon (emoji)."),
  estimatedMinutes: z.coerce.number().int().min(15).max(720),
  basePriceNpr: z.coerce.number().int().min(0),
  transportRequired: z.string().optional(),
  requiresApproval: z.string().optional(),
  isActive: z.string().optional(),
});

export async function upsertService(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const serviceId = String(formData.get("serviceId") ?? "");
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = {
    name: parsed.data.name,
    nameNe: parsed.data.nameNe || null,
    description: parsed.data.description,
    icon: parsed.data.icon,
    estimatedMinutes: parsed.data.estimatedMinutes,
    basePriceNpr: parsed.data.basePriceNpr,
    transportRequired: parsed.data.transportRequired === "on",
    requiresApproval: parsed.data.requiresApproval === "on",
    isActive: parsed.data.isActive === "on",
  };

  if (serviceId) {
    await db.service.update({ where: { id: serviceId }, data });
    await logAudit(admin.id, "service.update", `Service:${serviceId}`, data.name);
  } else {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await db.service.findUnique({ where: { slug } });
    await db.service.create({
      data: { ...data, slug: existing ? `${slug}-${Date.now() % 1000}` : slug },
    });
    await logAudit(admin.id, "service.create", `Service:${slug}`, data.name);
  }
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return {};
}
