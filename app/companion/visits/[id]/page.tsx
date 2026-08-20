import { notFound } from "next/navigation";
import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDuration, formatNpr, formatTime } from "@/lib/format";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/labels";
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  DescriptionItem,
  PageHeader,
} from "@/components/ui";
import { StatusTimeline } from "@/components/status-timeline";
import { VisitReportView } from "@/components/visit-report-view";
import {
  AcceptRejectForms,
  CompanionSosButton,
  CompleteVisitButton,
  IncidentForm,
  StartVisitButton,
} from "./visit-actions";

export default async function CompanionVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireCompanion();
  const { id } = await params;

  const assignment = await db.companionAssignment.findFirst({
    where: { bookingId: id, companionId: profile.id, status: { in: ["PENDING", "ACCEPTED"] } },
    include: {
      booking: {
        include: {
          elder: { include: { emergencyContacts: true } },
          services: { include: { service: true } },
          visit: { include: { report: { include: { photos: true } } } },
          thread: true,
        },
      },
    },
  });
  if (!assignment) notFound();
  const booking = assignment.booking;
  const elder = booking.elder;
  const isVerified = profile.verification?.status === "VERIFIED";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Visit ${booking.code}`}
        subtitle={`${formatDate(booking.requestedDate)} · ${formatTime(booking.requestedTime)} · ${formatDuration(booking.durationMin)}`}
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

        {/* Respond to a pending assignment */}
        {assignment.status === "PENDING" && (
          <Card className="border-primary-300">
            <CardBody>
              <h2 className="font-bold text-lg text-stone-800 mb-1">
                Would you like to take this visit?
              </h2>
              <p className="text-sm text-stone-600 mb-4">
                Earnings for this visit: <strong>{formatNpr(booking.estimatedNpr)}</strong>
              </p>
              {isVerified ? (
                <AcceptRejectForms assignmentId={assignment.id} />
              ) : (
                <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
                  You can accept visits once your verification is complete.
                </p>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">The visit</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DescriptionItem label="Services">
                <ul>
                  {booking.services.map((bs) => (
                    <li key={bs.id}>{bs.service.icon} {bs.service.name}</li>
                  ))}
                </ul>
              </DescriptionItem>
              <DescriptionItem label="Instructions from the family">
                {booking.instructions || "—"}
              </DescriptionItem>
            </dl>
          </CardBody>
        </Card>

        {/* Elder care info — shared with consent once assignment accepted */}
        {assignment.status === "ACCEPTED" && elder.consentToShare ? (
          <Card>
            <CardBody>
              <h2 className="font-bold text-lg text-stone-800 mb-3">
                About {elder.nickname || elder.fullName}
              </h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DescriptionItem label="Name">{elder.fullName}</DescriptionItem>
                <DescriptionItem label="Language">
                  {elder.preferredLanguage === "ne" ? "Nepali" : "English"}
                </DescriptionItem>
                <DescriptionItem label="Address">
                  {elder.addressLine}, {elder.city}
                </DescriptionItem>
                <DescriptionItem label="Finding the home">
                  {elder.locationNotes || "—"}
                </DescriptionItem>
                <DescriptionItem label="Mobility">{elder.mobilityNotes || "—"}</DescriptionItem>
                <DescriptionItem label="Care notes">{elder.healthNotes || "—"}</DescriptionItem>
                <DescriptionItem label="Preferences">{elder.serviceNotes || "—"}</DescriptionItem>
                <DescriptionItem label="Emergency contacts">
                  <ul>
                    {elder.emergencyContacts.map((contact) => (
                      <li key={contact.id}>
                        {contact.name} ({contact.relation}) — {contact.phone}
                      </li>
                    ))}
                  </ul>
                </DescriptionItem>
              </dl>
              <p className="mt-4 text-xs text-stone-500 border-t border-stone-100 pt-3">
                Shared with the family&apos;s consent for this visit only. Please treat it
                confidentially.
              </p>
            </CardBody>
          </Card>
        ) : assignment.status === "PENDING" ? (
          <Card>
            <CardBody>
              <p className="text-stone-600 text-sm">
                Full care details ({elder.city} area) are shared after you accept the visit.
              </p>
            </CardBody>
          </Card>
        ) : null}

        {/* Visit progress actions */}
        {assignment.status === "ACCEPTED" && booking.status === "CONFIRMED" && (
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-stone-700">When you arrive, mark the visit as started.</p>
              <StartVisitButton bookingId={booking.id} />
            </CardBody>
          </Card>
        )}
        {booking.status === "IN_PROGRESS" && (
          <Card className="border-violet-300">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-stone-800">Visit in progress</p>
                <p className="text-sm text-stone-600">
                  Started {booking.visit?.startedAt ? formatTime(booking.visit.startedAt.toTimeString().slice(0, 5)) : ""}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <CompanionSosButton bookingId={booking.id} />
                <CompleteVisitButton bookingId={booking.id} />
              </div>
            </CardBody>
          </Card>
        )}
        {booking.status === "COMPLETED" && booking.visit && !booking.visit.report && (
          <Card className="border-amber-300 bg-amber-50">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-amber-900">One last step — the visit report</p>
                <p className="text-sm text-amber-800">
                  The family is waiting to hear how the visit went.
                </p>
              </div>
              <ButtonLink href={`/companion/visits/${booking.id}/report`}>
                Write visit report
              </ButtonLink>
            </CardBody>
          </Card>
        )}

        {booking.visit?.report && <VisitReportView report={booking.visit.report} />}

        {assignment.status === "ACCEPTED" && (
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {booking.thread && (
              <ButtonLink href={`/companion/messages/${booking.thread.id}`} variant="secondary">
                💬 Message the family
              </ButtonLink>
            )}
            <IncidentForm bookingId={booking.id} />
          </div>
        )}
      </div>
    </div>
  );
}
