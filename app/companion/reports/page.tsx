import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function CompanionReportsPage() {
  const { profile } = await requireCompanion();

  const [due, submitted] = await Promise.all([
    db.booking.findMany({
      where: {
        assignment: { companionId: profile.id, status: "ACCEPTED" },
        status: "COMPLETED",
        visit: { report: null },
      },
      include: { elder: true },
      orderBy: { requestedDate: "desc" },
    }),
    db.visitReport.findMany({
      where: { visit: { booking: { assignment: { companionId: profile.id } } } },
      include: { visit: { include: { booking: { include: { elder: true } } } } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Visit reports" subtitle="Reports you owe and reports you've submitted." />

      {due.length > 0 && (
        <section className="mb-8">
          <h2 className="font-bold text-lg text-amber-800 mb-3">⏳ Waiting for your report</h2>
          <div className="space-y-3">
            {due.map((booking) => (
              <Card key={booking.id} className="border-amber-300 bg-amber-50">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-800">
                      {booking.code} · {booking.elder.fullName}
                    </p>
                    <p className="text-sm text-stone-600">{formatDate(booking.requestedDate)}</p>
                  </div>
                  <ButtonLink href={`/companion/visits/${booking.id}/report`} size="sm">
                    Write report
                  </ButtonLink>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-lg text-stone-800 mb-3">Submitted</h2>
        {submitted.length === 0 ? (
          <EmptyState icon="📖" title="No reports yet" body="Reports you submit appear here." />
        ) : (
          <div className="space-y-3">
            {submitted.map((report) => (
              <Card key={report.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-800">
                      {report.visit.booking.code} · {report.visit.booking.elder.fullName}
                    </p>
                    <p className="text-sm text-stone-600">
                      Submitted {formatDate(report.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.familyAcknowledged && (
                      <Badge tone="bg-leaf-100 text-leaf-700">Seen by family</Badge>
                    )}
                    <ButtonLink
                      href={`/companion/visits/${report.visit.bookingId}`}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </ButtonLink>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
