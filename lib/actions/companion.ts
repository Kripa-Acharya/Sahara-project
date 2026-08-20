"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompanion } from "@/lib/auth";
import { notify, notifyAdmins } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import type { FormState } from "@/lib/actions/auth";

/** Accept or reject an assignment offered to this companion. */
export async function respondToAssignment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireCompanion();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const response = String(formData.get("response") ?? "");
  const rejectReason = String(formData.get("rejectReason") ?? "").trim();

  if (!["accept", "reject"].includes(response)) return { error: "Invalid response." };

  const assignment = await db.companionAssignment.findFirst({
    where: { id: assignmentId, companionId: profile.id, status: "PENDING" },
    include: { booking: { include: { elder: { include: { family: { include: { user: true } } } } } } },
  });
  if (!assignment) return { error: "This assignment is no longer available." };

  if (response === "accept") {
    // Status-guarded transaction: a concurrent duplicate response (double
    // click, second tab) finds the assignment no longer PENDING and aborts.
    const applied = await db.$transaction(async (tx) => {
      const updated = await tx.companionAssignment.updateMany({
        where: { id: assignment.id, status: "PENDING" },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      if (updated.count === 0) return false;
      await tx.booking.update({
        where: { id: assignment.bookingId },
        data: { status: "CONFIRMED" },
      });
      // Ensure a visit record exists for the confirmed booking.
      await tx.visit.upsert({
        where: { bookingId: assignment.bookingId },
        update: {},
        create: { bookingId: assignment.bookingId, status: "SCHEDULED" },
      });
      return true;
    });
    if (!applied) return { error: "This assignment is no longer available." };
    const familyUser = assignment.booking.elder.family.user;
    await notify(
      familyUser.id,
      "BOOKING",
      `${user.name.split(" ")[0]} will visit ${assignment.booking.elder.nickname || assignment.booking.elder.fullName}`,
      `${assignment.booking.requestedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${assignment.booking.requestedTime}. You'll receive a full update afterwards.`,
      `/family/bookings/${assignment.bookingId}`,
    );
    await notifyAdmins(
      "BOOKING",
      `Companion accepted ${assignment.booking.code}`,
      `${user.name} accepted the assignment.`,
      `/admin/bookings/${assignment.bookingId}`,
    );
  } else {
    const rejected = await db.companionAssignment.updateMany({
      where: { id: assignment.id, status: "PENDING" },
      data: { status: "REJECTED", respondedAt: new Date(), rejectReason: rejectReason || null },
    });
    if (rejected.count === 0) return { error: "This assignment is no longer available." };
    await db.$transaction([
      db.booking.update({
        where: { id: assignment.bookingId },
        data: { status: "AWAITING_ASSIGNMENT" },
      }),
    ]);
    await notifyAdmins(
      "BOOKING",
      `Companion declined ${assignment.booking.code}`,
      rejectReason || `${user.name} declined the assignment.`,
      `/admin/bookings/${assignment.bookingId}`,
    );
  }

  revalidatePath("/companion/visits");
  revalidatePath("/companion");
  return {};
}

/** Mark an accepted visit as started. */
export async function startVisit(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireCompanion();
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      status: "CONFIRMED",
      assignment: { companionId: profile.id, status: "ACCEPTED" },
    },
    include: { elder: { include: { family: { include: { user: true } } } } },
  });
  if (!booking) return { error: "This visit cannot be started." };

  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "IN_PROGRESS" } }),
    db.visit.upsert({
      where: { bookingId: booking.id },
      update: { status: "STARTED", startedAt: new Date() },
      create: { bookingId: booking.id, status: "STARTED", startedAt: new Date() },
    }),
  ]);
  await notify(
    booking.elder.family.user.id,
    "VISIT",
    `Visit started — ${booking.code}`,
    `The companion has arrived and the visit is under way.`,
    `/family/bookings/${booking.id}`,
  );
  revalidatePath(`/companion/visits/${booking.id}`);
  return {};
}

/** Mark a started visit as completed. */
export async function completeVisit(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireCompanion();
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      status: "IN_PROGRESS",
      assignment: { companionId: profile.id, status: "ACCEPTED" },
    },
    include: { elder: { include: { family: { include: { user: true } } } } },
  });
  if (!booking) return { error: "This visit cannot be completed." };

  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "COMPLETED", finalNpr: booking.estimatedNpr } }),
    db.visit.update({
      where: { bookingId: booking.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
  ]);
  await notify(
    booking.elder.family.user.id,
    "VISIT",
    `Visit completed — ${booking.code}`,
    "The visit has finished. The companion's report will follow shortly.",
    `/family/bookings/${booking.id}`,
  );
  revalidatePath(`/companion/visits/${booking.id}`);
  return {};
}

const reportSchema = z.object({
  bookingId: z.string().min(1),
  arrivalTime: z.string().trim().optional(),
  departureTime: z.string().trim().optional(),
  tasksCompleted: z.string().trim().min(3, "Please describe the tasks completed."),
  wellbeingNote: z.string().trim().min(3, "Please describe how the elder is doing."),
  foodNote: z.string().trim().optional(),
  medicineNote: z.string().trim().optional(),
  appointmentNote: z.string().trim().optional(),
  householdConcern: z.string().trim().optional(),
  safetyConcern: z.string().trim().optional(),
  companionNotes: z.string().trim().optional(),
  followUpRecommended: z.string().optional(),
  incidentReported: z.string().optional(),
  photoNames: z.string().trim().optional(),
});

/** Submit the structured report for a completed visit. */
export async function submitVisitReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireCompanion();
  const parsed = reportSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const booking = await db.booking.findFirst({
    where: {
      id: data.bookingId,
      assignment: { companionId: profile.id, status: "ACCEPTED" },
    },
    include: {
      visit: { include: { report: true } },
      services: { include: { service: true } },
      elder: { include: { family: { include: { user: true } } } },
    },
  });
  if (!booking || !booking.visit) return { error: "Visit not found." };
  if (booking.visit.status !== "COMPLETED") return { error: "Complete the visit before submitting the report." };
  if (booking.visit.report) return { error: "A report has already been submitted for this visit." };

  // Simulated photo upload: comma-separated file names, validated for safe extensions.
  const photoNames = (data.photoNames ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  const unsafe = photoNames.find((n) => !/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(n));
  if (unsafe) {
    return { error: `"${unsafe}" doesn't look like an image file name (jpg, png, or webp).` };
  }

  const incidentReported = data.incidentReported === "on";

  await db.visitReport.create({
    data: {
      visitId: booking.visit.id,
      arrivalTime: data.arrivalTime || null,
      departureTime: data.departureTime || null,
      servicesCompleted: booking.services.map((s) => s.service.name).join(", "),
      tasksCompleted: data.tasksCompleted,
      wellbeingNote: data.wellbeingNote,
      foodNote: data.foodNote || null,
      medicineNote: data.medicineNote || null,
      appointmentNote: data.appointmentNote || null,
      householdConcern: data.householdConcern || null,
      safetyConcern: data.safetyConcern || null,
      companionNotes: data.companionNotes || null,
      followUpRecommended: data.followUpRecommended === "on",
      incidentReported,
      photos: { create: photoNames.map((fileName) => ({ fileName })) },
    },
  });

  if (incidentReported) {
    await db.incident.create({
      data: {
        bookingId: booking.id,
        reportedById: user.id,
        title: `Incident during visit ${booking.code}`,
        description: data.safetyConcern || data.companionNotes || "Reported via visit report.",
      },
    });
    await notifyAdmins(
      "SYSTEM",
      `Incident reported on ${booking.code}`,
      data.safetyConcern || undefined,
      "/admin/incidents",
    );
  }

  await notify(
    booking.elder.family.user.id,
    "VISIT",
    `${booking.elder.nickname || booking.elder.fullName}'s visit update is ready for your family`,
    "Read how the visit went, including notes and photos.",
    `/family/bookings/${booking.id}`,
  );

  revalidatePath("/companion/visits");
  redirect(`/companion/visits/${booking.id}`);
}

const availabilitySchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function addAvailability(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireCompanion();
  const parsed = availabilitySchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) return { error: "Please choose a day and a valid time range." };
  if (parsed.data.startTime >= parsed.data.endTime) {
    return { error: "End time must be after start time." };
  }

  await db.availability.upsert({
    where: {
      companionId_weekday_startTime: {
        companionId: profile.id,
        weekday: parsed.data.weekday,
        startTime: parsed.data.startTime,
      },
    },
    update: { endTime: parsed.data.endTime },
    create: { companionId: profile.id, ...parsed.data },
  });
  revalidatePath("/companion/availability");
  return {};
}

export async function removeAvailability(formData: FormData): Promise<void> {
  const { profile } = await requireCompanion();
  const slotId = String(formData.get("slotId") ?? "");
  await db.availability.deleteMany({ where: { id: slotId, companionId: profile.id } });
  revalidatePath("/companion/availability");
}

const companionProfileSchema = z.object({
  bio: z.string().trim().max(1000).optional(),
  languages: z.string().trim().optional(),
  skills: z.string().trim().optional(),
  serviceAreas: z.string().trim().optional(),
  citizenshipDoc: z.string().trim().optional(),
  policeReportDoc: z.string().trim().optional(),
  referenceNotes: z.string().trim().max(1000).optional(),
});

export async function updateCompanionProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireCompanion();
  const parsed = companionProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  // Simulated document upload: file names only, validated for safe extensions.
  for (const doc of [data.citizenshipDoc, data.policeReportDoc]) {
    if (doc && !/^[\w .-]+\.(pdf|jpg|jpeg|png)$/i.test(doc)) {
      return { error: `"${doc}" doesn't look like a document file name (pdf, jpg, or png).` };
    }
  }

  const submittedNewDocs =
    (data.citizenshipDoc && data.citizenshipDoc !== profile.citizenshipDoc) ||
    (data.policeReportDoc && data.policeReportDoc !== profile.policeReportDoc);

  await db.companionProfile.update({
    where: { id: profile.id },
    data: {
      bio: data.bio || null,
      languages: data.languages || "ne",
      skills: data.skills || null,
      serviceAreas: data.serviceAreas || null,
      citizenshipDoc: data.citizenshipDoc || profile.citizenshipDoc,
      policeReportDoc: data.policeReportDoc || profile.policeReportDoc,
      referenceNotes: data.referenceNotes || profile.referenceNotes,
    },
  });

  // Reflect submissions on the verification checklist and flag for admin review.
  const verification = profile.verification;
  if (verification) {
    await db.companionVerification.update({
      where: { id: verification.id },
      data: {
        idSubmitted: verification.idSubmitted || Boolean(data.citizenshipDoc),
        policeReportSubmitted: verification.policeReportSubmitted || Boolean(data.policeReportDoc),
        status:
          verification.status === "INCOMPLETE" && submittedNewDocs
            ? "UNDER_REVIEW"
            : verification.status,
      },
    });
    if (submittedNewDocs) {
      await notifyAdmins(
        "SYSTEM",
        `Companion documents submitted — ${user.name}`,
        "New verification documents are ready for review.",
        "/admin/companions",
      );
      await logAudit(user.id, "companion.documents.submit", `CompanionProfile:${profile.id}`);
    }
  }

  revalidatePath("/companion/profile");
  revalidatePath("/companion/verification");
  return {};
}

const incidentSchema = z.object({
  bookingId: z.string().optional(),
  title: z.string().trim().min(3, "Please give the concern a short title."),
  description: z.string().trim().min(10, "Please describe what happened."),
});

/** Companion reports a concern or incident, optionally tied to a booking. */
export async function reportIncident(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, profile } = await requireCompanion();
  const parsed = incidentSchema.safeParse({
    bookingId: formData.get("bookingId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if (parsed.data.bookingId) {
    const booking = await db.booking.findFirst({
      where: { id: parsed.data.bookingId, assignment: { companionId: profile.id } },
    });
    if (!booking) return { error: "Booking not found." };
  }

  await db.incident.create({
    data: {
      bookingId: parsed.data.bookingId || null,
      reportedById: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });
  await notifyAdmins("SYSTEM", `Incident reported by ${user.name}`, parsed.data.title, "/admin/incidents");
  revalidatePath("/companion/visits");
  return {};
}
