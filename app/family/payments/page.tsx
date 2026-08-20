import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNpr } from "@/lib/format";
import { paymentMethodLabel, paymentStatusLabel, paymentStatusTone } from "@/lib/labels";
import { Badge, ButtonLink, Card, CardBody, DemoNote, EmptyState, PageHeader } from "@/components/ui";

export default async function FamilyPaymentsPage() {
  const { profile } = await requireFamily();
  const payments = await db.payment.findMany({
    where: { familyId: profile.id },
    include: { booking: { include: { elder: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = payments
    .filter((p) => ["PAID", "CASH_RECEIVED"].includes(p.status))
    .reduce((sum, p) => sum + p.amountNpr, 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle={`Total paid so far: ${formatNpr(totalPaid)}`} />
      <div className="mb-5">
        <DemoNote>
          All payments in this MVP are simulated. No real cards, wallets, or banks are involved.
        </DemoNote>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon="💳" title="No payments yet" body="Payments appear here once you book a visit." />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-800">
                    {payment.booking.code} · {payment.booking.elder.fullName}
                  </p>
                  <p className="text-sm text-stone-600">
                    {formatDate(payment.createdAt)} · {paymentMethodLabel[payment.method]}
                    {payment.reference ? ` · Ref ${payment.reference}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-primary-700">{formatNpr(payment.amountNpr)}</p>
                  <Badge tone={paymentStatusTone[payment.status]}>
                    {paymentStatusLabel[payment.status]}
                  </Badge>
                  <ButtonLink href={`/family/bookings/${payment.bookingId}`} variant="outline" size="sm">
                    Booking
                  </ButtonLink>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
