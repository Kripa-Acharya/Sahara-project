import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNpr } from "@/lib/format";
import { paymentMethodLabel, paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { Badge, ButtonLink, Card, CardBody, DemoNote, EmptyState, PageHeader } from "@/components/ui";
import { PaymentStatusForm } from "../bookings/[id]/admin-booking-actions";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = await db.payment.findMany({
    include: { booking: { include: { elder: true } }, family: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totals = {
    collected: payments
      .filter((p) => ["PAID", "CASH_RECEIVED"].includes(p.status))
      .reduce((sum, p) => sum + p.amountNpr, 0),
    outstanding: payments
      .filter((p) => ["PENDING", "CASH_DUE", "AUTHORIZED"].includes(p.status))
      .reduce((sum, p) => sum + p.amountNpr, 0),
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`Collected ${formatNpr(totals.collected)} · Outstanding ${formatNpr(totals.outstanding)}`}
      />
      <div className="mb-5">
        <DemoNote>All payments are simulated in this MVP.</DemoNote>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon="💳" title="No payments yet" />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardBody>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-800">
                      {payment.booking.code} · {payment.booking.elder.fullName}
                    </p>
                    <p className="text-sm text-stone-600">
                      {payment.family?.user.name ?? "—"} · {formatDate(payment.createdAt)} ·{" "}
                      {paymentMethodLabel[payment.method]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-primary-700">{formatNpr(payment.amountNpr)}</p>
                    <Badge tone={paymentStatusTone[payment.status]}>
                      {paymentStatusLabel[payment.status]}
                    </Badge>
                    <ButtonLink href={`/admin/bookings/${payment.bookingId}`} variant="outline" size="sm">
                      Booking
                    </ButtonLink>
                  </div>
                </div>
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <PaymentStatusForm paymentId={payment.id} current={payment.status} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
