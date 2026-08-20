import Link from "next/link";
import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyAcknowledgeAlert } from "@/lib/actions/bookings";
import { formatDate, formatNpr, formatTime } from "@/lib/format";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/labels";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function FamilyHomePage() {
  const { user, profile } = await requireFamily();

  const [elders, activeAlerts, upcoming, latestReport] = await Promise.all([
    db.elderProfile.findMany({ where: { familyId: profile.id } }),
    db.emergencyAlert.findMany({
      where: { elder: { familyId: profile.id }, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
      include: { elder: true },
      orderBy: { createdAt: "desc" },
    }),
    db.booking.findMany({
      where: {
        familyId: profile.id,
        status: { in: ["REQUESTED", "AWAITING_ASSIGNMENT", "COMPANION_ASSIGNED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
      },
      include: {
        elder: true,
        services: { include: { service: true } },
        assignment: { include: { companion: { include: { user: true } } } },
      },
      orderBy: { requestedDate: "asc" },
      take: 3,
    }),
    db.visitReport.findFirst({
      where: { visit: { booking: { familyId: profile.id } } },
      orderBy: { submittedAt: "desc" },
      include: { visit: { include: { booking: { include: { elder: true } } } } },
    }),
  ]);

  // Warm status line drawn from the latest report — reassurance first.
  const primaryElder = elders[0];
  const latestIsCalm =
    latestReport && !latestReport.safetyConcern && !latestReport.incidentReported;
  const wellbeingLine =
    activeAlerts.length > 0
      ? "Something needs your attention below."
      : primaryElder && latestIsCalm
        ? `${primaryElder.nickname || primaryElder.fullName.split(" ")[0]} is doing well — see the latest visit update below.`
        : "Here's how your loved ones are doing.";

  return (
    <div>
      <PageHeader
        title={`नमस्ते, ${user.name.split(" ")[0]} 👋`}
        subtitle={wellbeingLine}
        action={<ButtonLink href="/family/book">+ Book a visit</ButtonLink>}
      />

      {/* Emergency alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="border-rose-300 bg-rose-50">
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-rose-900 text-lg">
                      🆘 Emergency alert — {alert.elder.fullName}
                    </p>
                    <p className="text-rose-800 mt-1">{alert.description || "SOS was activated."}</p>
                    {alert.locationText && (
                      <p className="text-sm text-rose-700 mt-1">📍 {alert.locationText}</p>
                    )}
                    <p className="text-sm text-rose-700 mt-2">
                      साहारा support has been notified. In a life-threatening situation call local
                      emergency services first (Police 100, Ambulance 102).
                    </p>
                  </div>
                  {alert.status === "ACTIVE" && (
                    <form action={familyAcknowledgeAlert}>
                      <input type="hidden" name="alertId" value={alert.id} />
                      <SubmitButton variant="danger" size="sm">I&apos;ve seen this</SubmitButton>
                    </form>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {elders.length === 0 ? (
        <EmptyState
          icon="👵"
          title="Let's start with your loved one's profile"
          body="Tell us about your parent or relative in Nepal so we can arrange the right companion."
          action={<ButtonLink href="/family/elders/new">Create elder profile</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming visits */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-lg text-stone-800">Upcoming visits</h2>
            {upcoming.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No visits are planned yet"
                body="Arrange support whenever your parent needs it — from a friendly chat to help with errands."
                action={<ButtonLink href="/family/book">Book a visit</ButtonLink>}
              />
            ) : (
              upcoming.map((booking) => (
                <Card key={booking.id}>
                  <CardBody>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge tone={bookingStatusTone[booking.status]}>
                            {bookingStatusLabel[booking.status]}
                          </Badge>
                          <span className="text-sm text-stone-500">{booking.code}</span>
                        </div>
                        <p className="mt-2 font-bold text-stone-800">
                          {formatDate(booking.requestedDate)} · {formatTime(booking.requestedTime)}
                        </p>
                        <p className="text-stone-600 text-sm">
                          {booking.services.map((s) => s.service.name).join(", ")} · for{" "}
                          {booking.elder.fullName}
                        </p>
                        {booking.assignment?.status === "ACCEPTED" && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                            <Avatar name={booking.assignment.companion.user.name} size="sm" />
                            Companion: <strong>{booking.assignment.companion.user.name}</strong>
                          </p>
                        )}
                      </div>
                      <ButtonLink href={`/family/bookings/${booking.id}`} variant="outline" size="sm">
                        View details
                      </ButtonLink>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>

          {/* Side column */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-stone-800">Your elders</h2>
            {elders.map((elder) => (
              <Card key={elder.id}>
                <CardBody className="flex items-center gap-3">
                  <Avatar name={elder.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-800 truncate">{elder.fullName}</p>
                    <p className="text-sm text-stone-500 truncate">{elder.city}</p>
                  </div>
                  <Link
                    href={`/family/elders/${elder.id}`}
                    className="text-sm text-primary-700 font-semibold hover:underline"
                  >
                    View
                  </Link>
                </CardBody>
              </Card>
            ))}

            {latestReport && (
              <>
                <h2 className="font-bold text-lg text-stone-800 pt-2">Latest visit report</h2>
                <Card>
                  <CardBody>
                    <p className="text-sm text-stone-500">
                      {formatDate(latestReport.submittedAt)} ·{" "}
                      {latestReport.visit.booking.elder.fullName}
                    </p>
                    <p className="mt-1 text-stone-700 line-clamp-3">
                      {latestReport.wellbeingNote || latestReport.companionNotes || "Report submitted."}
                    </p>
                    <ButtonLink
                      className="mt-3"
                      href={`/family/bookings/${latestReport.visit.bookingId}`}
                      variant="secondary"
                      size="sm"
                    >
                      Read full report
                    </ButtonLink>
                  </CardBody>
                </Card>
              </>
            )}

            <Card className="bg-leaf-50 border-leaf-100">
              <CardBody>
                <p className="font-semibold text-stone-800">💡 Elder screen</p>
                <p className="mt-1 text-sm text-stone-600">
                  Your elder can see their next visit and an SOS button on a simple screen — no
                  login needed, just their access code (find it on their profile).
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-stone-400">
        Total spent so far:{" "}
        {formatNpr(
          (
            await db.payment.aggregate({
              where: { familyId: profile.id, status: { in: ["PAID", "CASH_RECEIVED"] } },
              _sum: { amountNpr: true },
            })
          )._sum.amountNpr ?? 0,
        )}
      </p>
    </div>
  );
}
