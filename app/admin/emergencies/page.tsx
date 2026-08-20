import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { acknowledgeAlert } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { alertStatusLabel, alertStatusTone } from "@/lib/labels";
import { Badge, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ResolveAlertForm } from "./resolve-form";

export default async function AdminEmergenciesPage() {
  await requireAdmin();
  const alerts = await db.emergencyAlert.findMany({
    include: {
      elder: {
        include: {
          emergencyContacts: { orderBy: { isPrimary: "desc" } },
          family: { include: { user: true } },
        },
      },
      booking: {
        include: { assignment: { include: { companion: { include: { user: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const open = alerts.filter((a) => a.status !== "RESOLVED");
  const resolved = alerts.filter((a) => a.status === "RESOLVED");

  return (
    <div>
      <PageHeader
        title="Emergency alerts"
        subtitle="Handle SOS alerts from elders and companions."
      />
      <p className="mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 text-sm">
        साहारा does not replace police, ambulance, or medical services. For life-threatening
        situations direct callers to <strong>Police 100 / Ambulance 102</strong> immediately.
      </p>

      {open.length === 0 && resolved.length === 0 ? (
        <EmptyState icon="🆘" title="No alerts" body="Emergency alerts will appear here." />
      ) : (
        <>
          {open.map((alert) => {
            const companion = alert.booking?.assignment?.companion;
            const familyUser = alert.elder.family.user;
            const localContact = alert.elder.emergencyContacts.find((c) => c.isLocal);
            return (
              <Card key={alert.id} className="mb-4 border-rose-300 bg-rose-50">
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-rose-900 text-lg">
                        🆘 {alert.elder.fullName}{" "}
                        <Badge tone={alertStatusTone[alert.status]}>
                          {alertStatusLabel[alert.status]}
                        </Badge>
                      </p>
                      <p className="text-rose-800 mt-1">{alert.description || "SOS activated."}</p>
                      <p className="text-sm text-rose-700 mt-1">
                        Raised by {alert.raisedBy} · {formatDateTime(alert.createdAt)}
                        {alert.locationText ? ` · 📍 ${alert.locationText}` : ""}
                        {alert.booking ? ` · Booking ${alert.booking.code}` : ""}
                      </p>
                    </div>
                    {alert.status === "ACTIVE" && (
                      <form action={acknowledgeAlert}>
                        <input type="hidden" name="alertId" value={alert.id} />
                        <SubmitButton variant="danger" size="sm" pendingText="Saving…">
                          Acknowledge
                        </SubmitButton>
                      </form>
                    )}
                  </div>

                  {/* One-tap calls */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {localContact && (
                      <a
                        href={`tel:${localContact.phone}`}
                        className="rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                      >
                        📞 Local contact: {localContact.name} ({localContact.phone})
                      </a>
                    )}
                    <a
                      href={`tel:${familyUser.phone ?? ""}`}
                      className="rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                    >
                      📞 Family: {familyUser.name} ({familyUser.phone ?? "—"})
                    </a>
                    {companion && (
                      <a
                        href={`tel:${companion.user.phone ?? ""}`}
                        className="rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                      >
                        📞 Companion: {companion.user.name} ({companion.user.phone ?? "—"})
                      </a>
                    )}
                    <a
                      href="tel:+977-1-5551000"
                      className="rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                    >
                      📞 साहारा support
                    </a>
                  </div>

                  <div className="mt-4 border-t border-rose-200 pt-4">
                    <ResolveAlertForm alertId={alert.id} />
                  </div>
                </CardBody>
              </Card>
            );
          })}

          {resolved.length > 0 && (
            <section className="mt-8">
              <h2 className="font-bold text-lg text-stone-800 mb-3">Resolved</h2>
              <div className="space-y-3">
                {resolved.map((alert) => (
                  <Card key={alert.id} className="opacity-80">
                    <CardBody>
                      <p className="font-semibold text-stone-800">
                        {alert.elder.fullName}{" "}
                        <Badge tone={alertStatusTone[alert.status]}>
                          {alertStatusLabel[alert.status]}
                        </Badge>
                      </p>
                      <p className="text-sm text-stone-600 mt-1">
                        {formatDateTime(alert.createdAt)} · {alert.description}
                      </p>
                      {alert.resolvedNote && (
                        <p className="text-sm text-leaf-700 mt-1">✓ {alert.resolvedNote}</p>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
