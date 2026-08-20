import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Badge, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { IncidentStatusForm } from "./incident-form";
import type { IncidentStatus } from "@prisma/client";

const incidentTone: Record<IncidentStatus, string> = {
  OPEN: "bg-rose-100 text-rose-800",
  INVESTIGATING: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  DISMISSED: "bg-stone-200 text-stone-600",
};

export default async function AdminIncidentsPage() {
  await requireAdmin();
  const incidents = await db.incident.findMany({
    include: { booking: { include: { elder: true } } },
    orderBy: { createdAt: "desc" },
  });

  const reporterIds = [...new Set(incidents.map((i) => i.reportedById))];
  const reporters = await db.user.findMany({ where: { id: { in: reporterIds } } });
  const reporterName = (id: string) => reporters.find((u) => u.id === id)?.name ?? "Unknown";

  return (
    <div>
      <PageHeader title="Incidents & disputes" subtitle="Concerns reported by companions and families." />
      {incidents.length === 0 ? (
        <EmptyState icon="⚠️" title="No incidents" body="Reported concerns will appear here." />
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-800">
                      {incident.title}{" "}
                      <Badge tone={incidentTone[incident.status]}>{incident.status}</Badge>
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {formatDateTime(incident.createdAt)} · reported by {reporterName(incident.reportedById)}
                      {incident.booking
                        ? ` · ${incident.booking.code} (${incident.booking.elder.fullName})`
                        : ""}
                    </p>
                    <p className="text-stone-700 mt-2">{incident.description}</p>
                    {incident.resolution && (
                      <p className="text-sm text-leaf-700 mt-2">✓ {incident.resolution}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <IncidentStatusForm incidentId={incident.id} current={incident.status} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
