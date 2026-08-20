import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function FamilyReportsPage() {
  const { profile } = await requireFamily();
  const reports = await db.visitReport.findMany({
    where: { visit: { booking: { familyId: profile.id } } },
    include: {
      visit: { include: { booking: { include: { elder: true } } } },
      photos: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Visit reports"
        subtitle="A record of every visit — notes, updates, and photographs."
      />
      {reports.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No reports yet"
          body="After each completed visit, the companion's report will appear here."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-stone-800">
                    {formatDate(report.submittedAt)} · {report.visit.booking.elder.fullName}
                  </p>
                  <p className="text-sm text-stone-600 line-clamp-2">
                    {report.wellbeingNote || report.companionNotes || "Report submitted."}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {report.photos.length > 0 && (
                      <Badge tone="bg-sky-100 text-sky-800">📸 {report.photos.length} photos</Badge>
                    )}
                    {report.followUpRecommended && (
                      <Badge tone="bg-amber-100 text-amber-800">Follow-up recommended</Badge>
                    )}
                    {!report.familyAcknowledged && (
                      <Badge tone="bg-primary-100 text-primary-800">New</Badge>
                    )}
                  </div>
                </div>
                <ButtonLink
                  href={`/family/bookings/${report.visit.bookingId}`}
                  variant="outline"
                  size="sm"
                >
                  Read report
                </ButtonLink>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
