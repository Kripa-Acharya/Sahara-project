import { notFound, redirect } from "next/navigation";
import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { ReportForm } from "./report-form";

export default async function SubmitReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireCompanion();
  const { id } = await params;

  const booking = await db.booking.findFirst({
    where: { id, assignment: { companionId: profile.id, status: "ACCEPTED" } },
    include: {
      elder: true,
      visit: { include: { report: true } },
      services: { include: { service: true } },
    },
  });
  if (!booking || !booking.visit) notFound();
  if (booking.visit.report) redirect(`/companion/visits/${booking.id}`);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Visit report"
        subtitle={`${booking.code} · ${booking.elder.fullName} · ${formatDate(booking.requestedDate)}`}
      />
      <Card>
        <CardBody>
          <p className="text-sm text-stone-500 mb-5">
            The family reads this word for word — write warmly and honestly. Your observations
            are updates, not medical diagnoses.
          </p>
          <ReportForm
            bookingId={booking.id}
            serviceNames={booking.services.map((s) => s.service.name)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
