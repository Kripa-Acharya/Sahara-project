import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function AdminReportsPage() {
  await requireAdmin();
  const reports = await db.visitReport.findMany({
    include: {
      visit: {
        include: {
          booking: {
            include: {
              elder: true,
              assignment: { include: { companion: { include: { user: true } } } },
            },
          },
        },
      },
      photos: true,
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Visit reports" subtitle="Every report submitted by companions." />
      {reports.length === 0 ? (
        <EmptyState icon="📖" title="No reports yet" />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const booking = report.visit.booking;
            return (
              <Card key={report.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-800">
                      {booking.code} · {booking.elder.fullName}
                    </p>
                    <p className="text-sm text-stone-600">
                      {formatDate(report.submittedAt)} · by{" "}
                      {booking.assignment?.companion.user.name ?? "—"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {report.incidentReported && (
                        <Badge tone="bg-rose-100 text-rose-800">Incident</Badge>
                      )}
                      {report.followUpRecommended && (
                        <Badge tone="bg-amber-100 text-amber-800">Follow-up</Badge>
                      )}
                      {report.photos.length > 0 && (
                        <Badge tone="bg-sky-100 text-sky-800">📸 {report.photos.length}</Badge>
                      )}
                    </div>
                  </div>
                  <ButtonLink href={`/admin/bookings/${booking.id}`} variant="outline" size="sm">
                    View
                  </ButtonLink>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
