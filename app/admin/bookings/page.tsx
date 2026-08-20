import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNpr, formatTime } from "@/lib/format";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/labels";
import { Badge, ButtonLink, Card, CardBody, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import type { BookingStatus } from "@prisma/client";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const bookings = await db.booking.findMany({
    where: {
      ...(status && status !== "ALL" ? { status: status as BookingStatus } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q } },
              { elder: { fullName: { contains: q } } },
              { callerName: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      elder: true,
      services: { include: { service: true } },
      assignment: { include: { companion: { include: { user: true } } } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Search, filter, assign, and manage every booking."
        action={<ButtonLink href="/admin/phone-booking">📞 New phone booking</ButtonLink>}
      />

      <form className="mb-5 flex flex-wrap gap-3" action="/admin/bookings" method="get">
        <div className="flex-1 min-w-52">
          <Input name="q" placeholder="Search code, elder, or caller…" defaultValue={q ?? ""} aria-label="Search bookings" />
        </div>
        <Select name="status" defaultValue={status ?? "ALL"} className="w-auto" aria-label="Filter by status">
          <option value="ALL">All statuses</option>
          {Object.entries(bookingStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <button type="submit" className="rounded-xl bg-primary-600 text-white font-semibold px-5 hover:bg-primary-700">
          Filter
        </button>
      </form>

      {bookings.length === 0 ? (
        <EmptyState icon="🗒️" title="No bookings match" body="Try a different search or status." />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={bookingStatusTone[booking.status]}>
                      {bookingStatusLabel[booking.status]}
                    </Badge>
                    {booking.isPhoneBooking && <Badge tone="bg-sky-100 text-sky-800">📞 Phone</Badge>}
                    <span className="text-sm text-stone-500">{booking.code}</span>
                  </div>
                  <p className="mt-1 font-bold text-stone-800">
                    {booking.elder.fullName} · {formatDate(booking.requestedDate)} ·{" "}
                    {formatTime(booking.requestedTime)}
                  </p>
                  <p className="text-sm text-stone-600 truncate">
                    {booking.services.map((s) => s.service.name).join(", ")}
                    {booking.assignment ? ` · ${booking.assignment.companion.user.name}` : " · unassigned"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-700">{formatNpr(booking.estimatedNpr)}</p>
                  <ButtonLink href={`/admin/bookings/${booking.id}`} variant="outline" size="sm" className="mt-1">
                    Manage
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
