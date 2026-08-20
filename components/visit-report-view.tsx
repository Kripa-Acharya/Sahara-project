import type { VisitPhoto, VisitReport } from "@prisma/client";
import { Badge, Card, CardBody, DescriptionItem } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

/** Read-only visit report, shared by family and admin views. */
export function VisitReportView({
  report,
}: {
  report: VisitReport & { photos: VisitPhoto[] };
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-bold text-lg text-stone-800">Visit report</h2>
          <span className="text-sm text-stone-500">
            Submitted {formatDateTime(report.submittedAt)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {report.followUpRecommended && (
            <Badge tone="bg-amber-100 text-amber-800">Follow-up recommended</Badge>
          )}
          {report.incidentReported && (
            <Badge tone="bg-rose-100 text-rose-800">Incident reported</Badge>
          )}
          {report.familyAcknowledged && (
            <Badge tone="bg-leaf-100 text-leaf-700">Seen by family</Badge>
          )}
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <DescriptionItem label="Arrival">{report.arrivalTime || "—"}</DescriptionItem>
          <DescriptionItem label="Departure">{report.departureTime || "—"}</DescriptionItem>
          <DescriptionItem label="Services completed">
            {report.servicesCompleted || "—"}
          </DescriptionItem>
          <DescriptionItem label="Tasks completed">{report.tasksCompleted || "—"}</DescriptionItem>
          <DescriptionItem label="General wellbeing">{report.wellbeingNote || "—"}</DescriptionItem>
          <DescriptionItem label="Food & groceries">{report.foodNote || "—"}</DescriptionItem>
          <DescriptionItem label="Medicine">{report.medicineNote || "—"}</DescriptionItem>
          <DescriptionItem label="Appointments">{report.appointmentNote || "—"}</DescriptionItem>
          <DescriptionItem label="Household concerns">
            {report.householdConcern || "None noted"}
          </DescriptionItem>
          <DescriptionItem label="Safety concerns">
            {report.safetyConcern || "None noted"}
          </DescriptionItem>
        </dl>

        {report.companionNotes && (
          <div className="mt-4 rounded-xl bg-primary-50 border border-primary-100 p-4">
            <p className="text-sm font-semibold text-primary-800 mb-1">Companion&apos;s notes</p>
            <p className="text-stone-700">{report.companionNotes}</p>
          </div>
        )}

        {report.photos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-stone-500 mb-2">Photographs</p>
            <ul className="flex flex-wrap gap-3">
              {report.photos.map((photo) => (
                <li
                  key={photo.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-center"
                >
                  <span aria-hidden className="text-3xl block">🖼️</span>
                  <span className="text-xs text-stone-600 block mt-1 max-w-32 truncate">
                    {photo.fileName}
                  </span>
                  {photo.caption && (
                    <span className="text-xs text-stone-500 block max-w-32">{photo.caption}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-stone-400">
              Demo: photos are stored as file names only.
            </p>
          </div>
        )}

        <p className="mt-5 text-xs text-stone-500 border-t border-stone-100 pt-3">
          Companions are caring helpers, not automatically medical professionals. Observations in
          this report are not medical diagnoses.
        </p>
      </CardBody>
    </Card>
  );
}
