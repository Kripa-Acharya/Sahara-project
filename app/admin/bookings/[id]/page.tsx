import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDuration, formatNpr, formatTime } from "@/lib/format";
import {
  assignmentStatusLabel,
  bookingStatusLabel,
  bookingStatusTone,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/labels";
import { Badge, Card, CardBody, DescriptionItem, PageHeader } from "@/components/ui";
import { StatusTimeline } from "@/components/status-timeline";
import { VisitReportView } from "@/components/visit-report-view";
import { AssignCompanionForm, BookingStatusForm, PaymentStatusForm } from "./admin-booking-actions";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      elder: { include: { family: { include: { user: true } } } },
      services: { include: { service: true } },
      assignment: { include: { companion: { include: { user: true } } } },
      visit: { include: { report: { include: { photos: true } } } },
      payment: true,
      review: true,
    },
  });
  if (!booking) notFound();

  // Verified companions available for assignment.
  const companions = await db.companionProfile.findMany({
    where: { verification: { status: "VERIFIED" }, user: { isActive: true } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const assignable = !["COMPLETED", "CANCELLED", "IN_PROGRESS"].includes(booking.status);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Booking ${booking.code}`}
        subtitle={`${booking.elder.fullName} · family: ${booking.elder.family.user.name}`}
        action={
          <Badge tone={bookingStatusTone[booking.status]}>
            {bookingStatusLabel[booking.status]}
          </Badge>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardBody>
            <StatusTimeline status={booking.status} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">Details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DescriptionItem label="Date & time">
                {formatDate(booking.requestedDate)} · {formatTime(booking.requestedTime)} ·{" "}
                {formatDuration(booking.durationMin)}
              </DescriptionItem>
              <DescriptionItem label="Estimated total">
                {formatNpr(booking.estimatedNpr)}
              </DescriptionItem>
              <DescriptionItem label="Services">
                {booking.services.map((s) => s.service.name).join(", ")}
              </DescriptionItem>
              <DescriptionItem label="Instructions">{booking.instructions || "—"}</DescriptionItem>
              <DescriptionItem label="Elder address">
                {booking.elder.addressLine}, {booking.elder.city}
              </DescriptionItem>
              <DescriptionItem label="Family contact">
                {booking.elder.family.user.name} · {booking.elder.family.user.phone ?? "—"}
              </DescriptionItem>
              {booking.isPhoneBooking && (
                <DescriptionItem label="Phone booking caller">
                  {booking.callerName} · {booking.callerPhone}
                </DescriptionItem>
              )}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">Companion assignment</h2>
            {booking.assignment ? (
              <p className="mb-3 text-stone-700">
                <strong>{booking.assignment.companion.user.name}</strong> —{" "}
                <Badge
                  tone={
                    booking.assignment.status === "ACCEPTED"
                      ? "bg-emerald-100 text-emerald-800"
                      : booking.assignment.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }
                >
                  {assignmentStatusLabel[booking.assignment.status]}
                </Badge>
                {booking.assignment.rejectReason && (
                  <span className="block text-sm text-stone-500 mt-1">
                    Reason: {booking.assignment.rejectReason}
                  </span>
                )}
              </p>
            ) : (
              <p className="mb-3 text-stone-500">No companion assigned yet.</p>
            )}
            {assignable && (
              <AssignCompanionForm
                bookingId={booking.id}
                companions={companions.map((c) => ({
                  id: c.id,
                  name: c.user.name,
                  areas: c.serviceAreas,
                }))}
                hasAssignment={Boolean(booking.assignment)}
              />
            )}
          </CardBody>
        </Card>

        {booking.payment && (
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="font-bold text-lg text-stone-800">Payment</h2>
                <Badge tone={paymentStatusTone[booking.payment.status]}>
                  {paymentStatusLabel[booking.payment.status]}
                </Badge>
              </div>
              <p className="text-stone-700 mb-3">
                {formatNpr(booking.payment.amountNpr)} · {paymentMethodLabel[booking.payment.method]}
                {booking.payment.reference ? ` · Ref ${booking.payment.reference}` : ""}
              </p>
              <PaymentStatusForm paymentId={booking.payment.id} current={booking.payment.status} />
            </CardBody>
          </Card>
        )}

        {booking.visit?.report && <VisitReportView report={booking.visit.report} />}

        {booking.review && (
          <Card className="bg-leaf-50 border-leaf-100">
            <CardBody>
              <p className="font-semibold text-stone-800">
                Family rating: {"★".repeat(booking.review.rating)}
              </p>
              {booking.review.comment && <p className="text-stone-600 mt-1">“{booking.review.comment}”</p>}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">Update booking status</h2>
            <BookingStatusForm bookingId={booking.id} current={booking.status} />
            <p className="mt-2 text-xs text-stone-500">
              Use with care — status changes are audit-logged.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
