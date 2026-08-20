import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { acknowledgeReport } from "@/lib/actions/bookings";
import { formatDate, formatDuration, formatNpr, formatTime } from "@/lib/format";
import {
  bookingStatusLabel,
  bookingStatusTone,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from "@/lib/labels";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  DescriptionItem,
  FormSuccess,
  PageHeader,
  VerifiedBadge,
} from "@/components/ui";
import { StatusTimeline } from "@/components/status-timeline";
import { VisitReportView } from "@/components/visit-report-view";
import { SubmitButton } from "@/components/submit-button";
import { CancelBookingForm, PayForm, ReviewForm } from "./booking-actions";

export default async function FamilyBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { profile } = await requireFamily();
  const { id } = await params;
  const { created } = await searchParams;

  const booking = await db.booking.findFirst({
    where: { id, familyId: profile.id },
    include: {
      elder: true,
      services: { include: { service: true } },
      assignment: {
        include: { companion: { include: { user: true, verification: true } } },
      },
      visit: { include: { report: { include: { photos: true } } } },
      payment: true,
      review: true,
      thread: true,
    },
  });
  if (!booking) notFound();

  const companion = booking.assignment?.status === "ACCEPTED" ? booking.assignment.companion : null;
  const report = booking.visit?.report ?? null;
  const canCancel = ["REQUESTED", "AWAITING_ASSIGNMENT", "COMPANION_ASSIGNED", "ACCEPTED", "CONFIRMED"].includes(booking.status);
  const canPay =
    booking.payment &&
    ["PENDING", "FAILED", "CASH_DUE"].includes(booking.payment.status) &&
    booking.status !== "CANCELLED";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Booking ${booking.code}`}
        subtitle={`For ${booking.elder.fullName}`}
        action={
          <Badge tone={bookingStatusTone[booking.status]}>
            {bookingStatusLabel[booking.status]}
          </Badge>
        }
      />

      {created && (
        <div className="mb-5">
          <FormSuccess message="Your booking request has been submitted. साहारा will assign a verified companion and you'll see updates here." />
        </div>
      )}

      <div className="space-y-5">
        <Card>
          <CardBody>
            <StatusTimeline status={booking.status} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">Visit details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DescriptionItem label="Date & time">
                {formatDate(booking.requestedDate)} · {formatTime(booking.requestedTime)} NPT
              </DescriptionItem>
              <DescriptionItem label="Estimated duration">
                {formatDuration(booking.durationMin)}
              </DescriptionItem>
              <DescriptionItem label="Services">
                <ul>
                  {booking.services.map((bs) => (
                    <li key={bs.id}>
                      {bs.service.icon} {bs.service.name} — {formatNpr(bs.priceNpr)}
                    </li>
                  ))}
                </ul>
              </DescriptionItem>
              <DescriptionItem label="Estimated total">
                <span className="font-bold text-primary-700">{formatNpr(booking.estimatedNpr)}</span>
              </DescriptionItem>
              <DescriptionItem label="Instructions">
                {booking.instructions || "—"}
              </DescriptionItem>
            </dl>
            {booking.cancelReason && (
              <p className="mt-3 text-sm text-stone-500">
                Cancellation reason: {booking.cancelReason}
              </p>
            )}
          </CardBody>
        </Card>

        {companion && (
          <Card>
            <CardBody className="flex flex-wrap items-center gap-4">
              <Avatar name={companion.user.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-800">{companion.user.name}</p>
                <p className="text-sm text-stone-600 line-clamp-2">{companion.bio}</p>
                <div className="mt-1.5">
                  {companion.verification?.status === "VERIFIED" && <VerifiedBadge />}
                </div>
              </div>
              {booking.thread && (
                <ButtonLink href={`/family/messages/${booking.thread.id}`} variant="secondary">
                  💬 Message
                </ButtonLink>
              )}
            </CardBody>
          </Card>
        )}

        {booking.payment && (
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg text-stone-800">Payment</h2>
                  <p className="text-stone-600 mt-1">
                    {formatNpr(booking.payment.amountNpr)} ·{" "}
                    {paymentMethodLabel[booking.payment.method]}
                  </p>
                  {booking.payment.reference && (
                    <p className="text-sm text-stone-500">Ref: {booking.payment.reference} (demo)</p>
                  )}
                </div>
                <Badge tone={paymentStatusTone[booking.payment.status]}>
                  {paymentStatusLabel[booking.payment.status]}
                </Badge>
              </div>
              {canPay && (
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <PayForm bookingId={booking.id} currentMethod={booking.payment.method} />
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {report && (
          <>
            <VisitReportView report={report} />
            {!report.familyAcknowledged && (
              <form action={acknowledgeReport} className="flex justify-end">
                <input type="hidden" name="reportId" value={report.id} />
                <SubmitButton variant="leaf" pendingText="Saving…">
                  ✓ I have read this report
                </SubmitButton>
              </form>
            )}
          </>
        )}

        {booking.status === "COMPLETED" && !booking.review && companion && (
          <Card>
            <CardBody>
              <h2 className="font-bold text-lg text-stone-800 mb-3">
                How was the visit with {companion.user.name}?
              </h2>
              <ReviewForm bookingId={booking.id} />
            </CardBody>
          </Card>
        )}

        {booking.review && (
          <Card className="bg-leaf-50 border-leaf-100">
            <CardBody>
              <p className="font-semibold text-stone-800">
                Your rating: {"★".repeat(booking.review.rating)}{"☆".repeat(5 - booking.review.rating)}
              </p>
              {booking.review.comment && (
                <p className="mt-1 text-stone-600">“{booking.review.comment}”</p>
              )}
            </CardBody>
          </Card>
        )}

        {canCancel && (
          <Card className="border-stone-200">
            <CardBody>
              <h2 className="font-semibold text-stone-700 mb-2">Need to cancel?</h2>
              <CancelBookingForm bookingId={booking.id} />
            </CardBody>
          </Card>
        )}

        <p className="text-center text-sm text-stone-400">
          Questions? <Link href="/family/messages" className="underline">Message साहारा support</Link>.
        </p>
      </div>
    </div>
  );
}
