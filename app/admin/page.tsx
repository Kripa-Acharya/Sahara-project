import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatNpr } from "@/lib/format";
import { Badge, ButtonLink, Card, CardBody, PageHeader } from "@/components/ui";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [
    familyCount,
    elderCount,
    verifiedCompanions,
    pendingApplications,
    awaitingAssignment,
    activeAlerts,
    openIncidents,
    paidTotal,
  ] = await Promise.all([
    db.familyProfile.count(),
    db.elderProfile.count(),
    db.companionVerification.count({ where: { status: "VERIFIED" } }),
    db.companionVerification.count({ where: { status: { in: ["INCOMPLETE", "UNDER_REVIEW"] } } }),
    db.booking.findMany({
      where: { status: { in: ["REQUESTED", "AWAITING_ASSIGNMENT"] } },
      include: { elder: true, services: { include: { service: true } } },
      orderBy: { requestedDate: "asc" },
      take: 5,
    }),
    db.emergencyAlert.findMany({
      where: { status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
      include: { elder: true },
      orderBy: { createdAt: "desc" },
    }),
    db.incident.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    db.payment.aggregate({
      where: { status: { in: ["PAID", "CASH_RECEIVED"] } },
      _sum: { amountNpr: true },
    }),
  ]);

  const stats = [
    { label: "Families", value: familyCount, href: "/admin/families" },
    { label: "Elders", value: elderCount, href: "/admin/elders" },
    { label: "Verified companions", value: verifiedCompanions, href: "/admin/companions" },
    { label: "Applications to review", value: pendingApplications, href: "/admin/companions?tab=applications" },
    { label: "Open incidents", value: openIncidents, href: "/admin/incidents" },
    { label: "Revenue (demo)", value: formatNpr(paidTotal._sum.amountNpr ?? 0), href: "/admin/payments" },
  ];

  return (
    <div>
      <PageHeader title="Overview" subtitle="Today at साहारा." />

      {activeAlerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="border-rose-300 bg-rose-50">
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-rose-900">
                    🆘 {alert.status === "ACTIVE" ? "ACTIVE" : "Acknowledged"} — {alert.elder.fullName}
                  </p>
                  <p className="text-sm text-rose-800">
                    {alert.description || "SOS activated."} · {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                <ButtonLink href="/admin/emergencies" variant="danger" size="sm">
                  Handle alert
                </ButtonLink>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardBody className="text-center">
                <p className="text-2xl font-extrabold text-primary-700">{stat.value}</p>
                <p className="text-sm text-stone-500">{stat.label}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg text-stone-800">Bookings awaiting assignment</h2>
          <ButtonLink href="/admin/bookings" variant="outline" size="sm">All bookings</ButtonLink>
        </div>
        {awaitingAssignment.length === 0 ? (
          <Card><CardBody className="text-stone-500">Nothing waiting — all bookings are assigned. 🎉</CardBody></Card>
        ) : (
          <div className="space-y-3">
            {awaitingAssignment.map((booking) => (
              <Card key={booking.id} className="border-amber-300">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-stone-800">
                      {booking.code} · {booking.elder.fullName}
                      {booking.isPhoneBooking && (
                        <Badge tone="bg-sky-100 text-sky-800" className="ml-2">📞 Phone</Badge>
                      )}
                    </p>
                    <p className="text-sm text-stone-600">
                      {booking.services.map((s) => s.service.name).join(", ")} ·{" "}
                      {booking.requestedDate.toDateString()} {booking.requestedTime}
                    </p>
                  </div>
                  <ButtonLink href={`/admin/bookings/${booking.id}`} size="sm">
                    Assign companion
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
