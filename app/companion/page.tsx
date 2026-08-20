import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNpr, formatTime } from "@/lib/format";
import { verificationStatusLabel, verificationStatusTone } from "@/lib/labels";
import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  VerifiedBadge,
} from "@/components/ui";

export default async function CompanionHomePage() {
  const { user, profile } = await requireCompanion();
  const verification = profile.verification;
  const isVerified = verification?.status === "VERIFIED";

  const [pendingAssignments, upcomingVisits, completedCount, earnings] = await Promise.all([
    db.companionAssignment.findMany({
      where: { companionId: profile.id, status: "PENDING" },
      include: { booking: { include: { elder: true, services: { include: { service: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.booking.findMany({
      where: {
        assignment: { companionId: profile.id, status: "ACCEPTED" },
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      include: { elder: true, services: { include: { service: true } } },
      orderBy: { requestedDate: "asc" },
      take: 5,
    }),
    db.booking.count({
      where: { assignment: { companionId: profile.id, status: "ACCEPTED" }, status: "COMPLETED" },
    }),
    db.booking.aggregate({
      where: { assignment: { companionId: profile.id, status: "ACCEPTED" }, status: "COMPLETED" },
      _sum: { finalNpr: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Namaste, ${user.name.split(" ")[0]} 🙏`}
        subtitle="Thank you for being someone's sahara."
      />

      {/* Verification banner */}
      {!isVerified && verification && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-amber-900">
                Verification status:{" "}
                <Badge tone={verificationStatusTone[verification.status]}>
                  {verificationStatusLabel[verification.status]}
                </Badge>
              </p>
              <p className="text-sm text-amber-800 mt-1">
                You can accept visits once साहारा completes your verification.
              </p>
            </div>
            <ButtonLink href="/companion/verification" variant="secondary" size="sm">
              View checklist
            </ButtonLink>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-extrabold text-primary-700">{completedCount}</p>
            <p className="text-sm text-stone-500">Completed visits</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-extrabold text-primary-700">
              {formatNpr(earnings._sum.finalNpr ?? 0)}
            </p>
            <p className="text-sm text-stone-500">Total earnings</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center flex flex-col items-center justify-center">
            {isVerified ? (
              <VerifiedBadge />
            ) : (
              <Badge tone={verificationStatusTone[verification?.status ?? "INCOMPLETE"]}>
                {verificationStatusLabel[verification?.status ?? "INCOMPLETE"]}
              </Badge>
            )}
            <p className="text-sm text-stone-500 mt-1.5">Verification</p>
          </CardBody>
        </Card>
      </div>

      {pendingAssignments.length > 0 && (
        <section className="mb-8">
          <h2 className="font-bold text-lg text-stone-800 mb-3">
            🔔 New visit requests for you
          </h2>
          <div className="space-y-3">
            {pendingAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-primary-300">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-800">
                      {formatDate(assignment.booking.requestedDate)} ·{" "}
                      {formatTime(assignment.booking.requestedTime)}
                    </p>
                    <p className="text-sm text-stone-600">
                      {assignment.booking.services.map((s) => s.service.name).join(", ")} ·{" "}
                      {assignment.booking.elder.city}
                    </p>
                  </div>
                  <ButtonLink href={`/companion/visits/${assignment.bookingId}`} size="sm">
                    Respond
                  </ButtonLink>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-lg text-stone-800 mb-3">Upcoming visits</h2>
        {upcomingVisits.length === 0 ? (
          <EmptyState
            icon="🗓️"
            title="No upcoming visits"
            body={
              isVerified
                ? "When साहारा assigns you a visit, it will appear here."
                : "Complete your verification to start receiving visits."
            }
          />
        ) : (
          <div className="space-y-3">
            {upcomingVisits.map((booking) => (
              <Card key={booking.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-800">
                      {formatDate(booking.requestedDate)} · {formatTime(booking.requestedTime)}
                    </p>
                    <p className="text-sm text-stone-600">
                      {booking.services.map((s) => s.service.name).join(", ")} · for{" "}
                      {booking.elder.fullName}
                    </p>
                  </div>
                  <ButtonLink href={`/companion/visits/${booking.id}`} variant="outline" size="sm">
                    View
                  </ButtonLink>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
