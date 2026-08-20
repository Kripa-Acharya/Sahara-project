"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFamily } from "@/lib/auth";
import { canAcknowledgeVisitReport } from "@/lib/policies";
import { nextBookingCode } from "@/lib/booking-code";
import { getPaymentProvider } from "@/lib/payments";
import { notifyAdmins } from "@/lib/notify";
import type { FormState } from "@/lib/actions/auth";
import type { PaymentMethod } from "@prisma/client";

const createBookingSchema = z.object({
  elderId: z.string().min(1, "Please choose an elder."),
  serviceIds: z.array(z.string()).min(1, "Please choose at least one service."),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Please choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a time."),
  durationMin: z.coerce.number().int().min(30).max(600),
  instructions: z.string().trim().max(2000).optional(),
  paymentMethod: z.enum([
    "INTERNATIONAL_CARD",
    "ESEWA",
    "KHALTI",
    "MOBILE_BANKING",
    "CASH",
    "REMITTANCE",
  ]),
  idempotencyKey: z.string().uuid("Please retry the booking."),
});

export async function createBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFamily();

  const parsed = createBookingSchema.safeParse({
    elderId: formData.get("elderId"),
    serviceIds: formData.getAll("serviceIds").map(String),
    date: formData.get("date"),
    time: formData.get("time"),
    durationMin: formData.get("durationMin"),
    // Absent optional fields arrive as null from FormData.
    instructions: formData.get("instructions") ?? undefined,
    paymentMethod: formData.get("paymentMethod"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  // Duplicate submission (double-click, network retry): return the original.
  const existing = await db.booking.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });
  if (existing) redirect(`/family/bookings/${existing.id}?created=1`);

  const elder = await db.elderProfile.findFirst({
    where: { id: data.elderId, familyId: profile.id },
  });
  if (!elder) return { error: "Elder profile not found." };

  // Calendar dates are stored at UTC midnight; times are NPT strings.
  const requestedDate = new Date(`${data.date}T00:00:00Z`);
  const todayUtc = new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z");
  if (requestedDate < todayUtc) {
    return { error: "Please choose today or a future date." };
  }

  const services = await db.service.findMany({
    where: { id: { in: data.serviceIds }, isActive: true },
  });
  if (services.length === 0) return { error: "Please choose at least one service." };

  // Price is always computed server-side from the service table.
  const estimatedNpr = services.reduce((sum, s) => sum + s.basePriceNpr, 0);

  // Booking + services + payment + thread are created atomically. The code
  // generator can race with concurrent submissions (unique constraint), so
  // retry with a fresh code a couple of times.
  let booking: { id: string; code: string } | null = null;
  for (let attempt = 0; attempt < 3 && !booking; attempt++) {
    const code = await nextBookingCode();
    try {
      booking = await db.booking.create({
        data: {
          code,
          familyId: profile.id,
          elderId: elder.id,
          status: "AWAITING_ASSIGNMENT",
          requestedDate,
          requestedTime: data.time,
          durationMin: data.durationMin,
          instructions: data.instructions || null,
          estimatedNpr,
          idempotencyKey: data.idempotencyKey,
          services: {
            create: services.map((s) => ({ serviceId: s.id, priceNpr: s.basePriceNpr })),
          },
          payment: {
            create: {
              familyId: profile.id,
              amountNpr: estimatedNpr,
              method: data.paymentMethod,
              status: data.paymentMethod === "CASH" ? "CASH_DUE" : "PENDING",
              provider: "demo",
            },
          },
          thread: {
            create: { subject: `Booking ${code}` },
          },
        },
        select: { id: true, code: true },
      });
    } catch (e: unknown) {
      // P2002 on `code` → regenerate; P2002 on `idempotencyKey` → concurrent
      // duplicate submission won the race; anything else rethrows.
      const known = e as { code?: string; meta?: { target?: string[] } };
      if (known.code !== "P2002") throw e;
      if (known.meta?.target?.includes("idempotencyKey")) {
        const winner = await db.booking.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (winner) redirect(`/family/bookings/${winner.id}?created=1`);
      }
    }
  }
  if (!booking) return { error: "We couldn't create the booking. Please try again." };

  await notifyAdmins(
    "BOOKING",
    `New booking request ${booking.code}`,
    `${elder.fullName} — ${services.map((s) => s.name).join(", ")}`,
    `/admin/bookings/${booking.id}`,
  );

  revalidatePath("/family/bookings");
  redirect(`/family/bookings/${booking.id}?created=1`);
}

export async function cancelBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFamily();
  const bookingId = String(formData.get("bookingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const booking = await db.booking.findFirst({
    where: { id: bookingId, familyId: profile.id },
  });
  if (!booking) return { error: "Booking not found." };
  if (["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(booking.status)) {
    return { error: "This booking can no longer be cancelled." };
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelReason: reason || "Cancelled by family" },
  });
  await notifyAdmins("BOOKING", `Booking ${booking.code} cancelled`, reason || undefined, `/admin/bookings/${booking.id}`);
  revalidatePath(`/family/bookings/${booking.id}`);
  revalidatePath("/family/bookings");
  return {};
}

/** Simulated payment through the demo provider. */
export async function payBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFamily();
  const bookingId = String(formData.get("bookingId") ?? "");
  const method = String(formData.get("method") ?? "") as PaymentMethod;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, familyId: profile.id },
    include: { payment: true },
  });
  if (!booking || !booking.payment) return { error: "Booking or payment not found." };
  if (booking.payment.status === "PAID") return { error: "This booking is already paid." };

  if (method === "CASH") {
    await db.payment.update({
      where: { id: booking.payment.id },
      data: { method, status: "CASH_DUE", reference: null, paidAt: null },
    });
    revalidatePath(`/family/bookings/${booking.id}`);
    return {};
  }

  const provider = getPaymentProvider("demo");
  const result = await provider.charge({
    bookingCode: booking.code,
    amountNpr: booking.payment.amountNpr,
    method,
  });
  if (!result.ok) return { error: result.message };

  await db.payment.update({
    where: { id: booking.payment.id },
    data: { method, status: "PAID", reference: result.reference, paidAt: new Date() },
  });
  revalidatePath(`/family/bookings/${booking.id}`);
  revalidatePath("/family/payments");
  return {};
}

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Please choose a rating.").max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await requireFamily();
  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const booking = await db.booking.findFirst({
    where: { id: parsed.data.bookingId, familyId: profile.id },
    include: { assignment: true, review: true },
  });
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "COMPLETED") return { error: "You can review a visit after it is completed." };
  if (booking.review) return { error: "This visit has already been reviewed." };
  if (!booking.assignment) return { error: "No companion was assigned to this booking." };

  await db.review.create({
    data: {
      bookingId: booking.id,
      familyId: profile.id,
      companionId: booking.assignment.companionId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });
  revalidatePath(`/family/bookings/${booking.id}`);
  return {};
}

/** Family confirms they have seen the visit report. */
export async function acknowledgeReport(formData: FormData): Promise<void> {
  const { user } = await requireFamily();
  const reportId = String(formData.get("reportId") ?? "");
  const report = await canAcknowledgeVisitReport(user, reportId);
  if (!report) return;
  const updated = await db.visitReport.update({
    where: { id: report.id },
    data: { familyAcknowledged: true, acknowledgedAt: new Date() },
    include: { visit: { select: { bookingId: true } } },
  });
  revalidatePath(`/family/bookings/${updated.visit.bookingId}`);
}

/** Family acknowledges an emergency alert notification. */
export async function familyAcknowledgeAlert(formData: FormData): Promise<void> {
  const { user, profile } = await requireFamily();
  const alertId = String(formData.get("alertId") ?? "");
  const alert = await db.emergencyAlert.findUnique({
    where: { id: alertId },
    include: { elder: true },
  });
  if (!alert || alert.elder.familyId !== profile.id) return;
  if (alert.status === "ACTIVE") {
    await db.emergencyAlert.update({
      where: { id: alert.id },
      data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
    });
    await notifyAdmins(
      "EMERGENCY",
      `Alert acknowledged by family (${user.name})`,
      `Elder: ${alert.elder.fullName}`,
      "/admin/emergencies",
    );
  }
  revalidatePath("/family");
}

export async function markNotificationsRead(): Promise<void> {
  const { user } = await requireFamily();
  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/family/notifications");
}
