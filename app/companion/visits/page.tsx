import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatTime } from "@/lib/format";
import { assignmentStatusLabel, bookingStatusLabel, bookingStatusTone } from "@/lib/labels";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function CompanionVisitsPage() {
  const { profile } = await requireCompanion();
  const assignments = await db.companionAssignment.findMany({
    where: { companionId: profile.id, status: { in: ["PENDING", "ACCEPTED"] } },
    include: {
      booking: {
        include: {
          elder: true,
          services: { include: { service: true } },
          visit: { include: { report: true } },
        },
      },
    },
    orderBy: { booking: { requestedDate: "desc" } },
  });

  const pending = assignments.filter((a) => a.status === "PENDING");
  const active = assignments.filter(
    (a) => a.status === "ACCEPTED" && !["COMPLETED", "CANCELLED", "DISPUTED"].includes(a.booking.status),
  );
  const past = assignments.filter(
    (a) => a.status === "ACCEPTED" && ["COMPLETED", "CANCELLED", "DISPUTED"].includes(a.booking.status),
  );

  return (
    <div>
      <PageHeader title="My visits" subtitle="Requests, upcoming visits, and your visit history." />

      {assignments.length === 0 ? (
        <EmptyState icon="🤝" title="No visits yet" body="Assigned visits will appear here." />
      ) : (
        <>
          <Group title="Waiting for your response" items={pending} highlight />
          <Group title="Upcoming & in progress" items={active} />
          <Group title="Past" items={past} />
        </>
      )}
    </div>
  );
}

type AssignmentItem = Awaited<
  ReturnType<typeof db.companionAssignment.findMany<{
    include: {
      booking: {
        include: {
          elder: true;
          services: { include: { service: true } };
          visit: { include: { report: true } };
        };
      };
    };
  }>>
>[number];

function Group({
  title,
  items,
  highlight,
}: {
  title: string;
  items: AssignmentItem[];
  highlight?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg text-stone-800 mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((assignment) => {
          const booking = assignment.booking;
          const needsReport =
            booking.status === "COMPLETED" && booking.visit && !booking.visit.report;
          return (
            <Card key={assignment.id} className={highlight ? "border-primary-300" : undefined}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={bookingStatusTone[booking.status]}>
                      {bookingStatusLabel[booking.status]}
                    </Badge>
                    {assignment.status === "PENDING" && (
                      <Badge tone="bg-primary-100 text-primary-800">
                        {assignmentStatusLabel[assignment.status]}
                      </Badge>
                    )}
                    {needsReport && (
                      <Badge tone="bg-amber-100 text-amber-800">Report due</Badge>
                    )}
                    <span className="text-sm text-stone-500">{booking.code}</span>
                  </div>
                  <p className="mt-1.5 font-bold text-stone-800">
                    {formatDate(booking.requestedDate)} · {formatTime(booking.requestedTime)}
                  </p>
                  <p className="text-sm text-stone-600 truncate">
                    {booking.services.map((s) => s.service.name).join(", ")} ·{" "}
                    {booking.elder.city}
                  </p>
                </div>
                <ButtonLink
                  href={`/companion/visits/${booking.id}`}
                  variant={assignment.status === "PENDING" || needsReport ? "primary" : "outline"}
                  size="sm"
                >
                  {assignment.status === "PENDING" ? "Respond" : needsReport ? "Submit report" : "View"}
                </ButtonLink>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
