import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNpr } from "@/lib/format";
import { Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function EarningsPage() {
  const { profile } = await requireCompanion();
  const completed = await db.booking.findMany({
    where: { assignment: { companionId: profile.id, status: "ACCEPTED" }, status: "COMPLETED" },
    include: { elder: true, services: { include: { service: true } }, review: true },
    orderBy: { requestedDate: "desc" },
  });

  const total = completed.reduce((sum, b) => sum + (b.finalNpr ?? b.estimatedNpr), 0);
  const ratings = completed.filter((b) => b.review).map((b) => b.review!.rating);
  const avgRating =
    ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  return (
    <div>
      <PageHeader title="Earnings" subtitle="Your completed visits and earnings to date." />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-extrabold text-primary-700">{formatNpr(total)}</p>
            <p className="text-sm text-stone-500">Total earned</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-extrabold text-primary-700">{completed.length}</p>
            <p className="text-sm text-stone-500">Completed visits</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-3xl font-extrabold text-primary-700">
              {avgRating ? `★ ${avgRating}` : "—"}
            </p>
            <p className="text-sm text-stone-500">Average rating</p>
          </CardBody>
        </Card>
      </div>

      {completed.length === 0 ? (
        <EmptyState icon="💰" title="No earnings yet" body="Completed visits appear here with their earnings." />
      ) : (
        <div className="space-y-3">
          {completed.map((booking) => (
            <Card key={booking.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-stone-800">
                    {booking.code} · {booking.elder.fullName}
                  </p>
                  <p className="text-sm text-stone-600">
                    {formatDate(booking.requestedDate)} ·{" "}
                    {booking.services.map((s) => s.service.name).join(", ")}
                  </p>
                  {booking.review && (
                    <p className="text-sm text-amber-600 mt-0.5">
                      {"★".repeat(booking.review.rating)} from the family
                    </p>
                  )}
                </div>
                <p className="font-bold text-primary-700">
                  {formatNpr(booking.finalNpr ?? booking.estimatedNpr)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-stone-500">
        Demo note: payout transfers to your bank or wallet are handled outside this MVP.
      </p>
    </div>
  );
}
