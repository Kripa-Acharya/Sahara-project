import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNpr, formatTime } from "@/lib/format";
import { bookingStatusLabel, bookingStatusTone } from "@/lib/labels";
import { Badge, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

const OPEN_STATUSES = [
  "DRAFT",
  "REQUESTED",
  "AWAITING_ASSIGNMENT",
  "COMPANION_ASSIGNED",
  "ACCEPTED",
  "CONFIRMED",
  "IN_PROGRESS",
] as const;

export default async function FamilyBookingsPage() {
  const { profile } = await requireFamily();
  const bookings = await db.booking.findMany({
    where: { familyId: profile.id },
    include: {
      elder: true,
      services: { include: { service: true } },
      assignment: { include: { companion: { include: { user: true } } } },
      payment: true,
    },
    orderBy: { requestedDate: "desc" },
  });

  const open = bookings.filter((b) => (OPEN_STATUSES as readonly string[]).includes(b.status));
  const past = bookings.filter((b) => !(OPEN_STATUSES as readonly string[]).includes(b.status));

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Upcoming and past companion visits."
        action={<ButtonLink href="/family/book">+ Book a visit</ButtonLink>}
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon="🗒️"
          title="No bookings yet"
          body="Your first booking is a few clicks away."
          action={<ButtonLink href="/family/book">Book a visit</ButtonLink>}
        />
      ) : (
        <>
          <BookingGroup title="Upcoming & active" bookings={open} />
          <BookingGroup title="Past" bookings={past} />
        </>
      )}
    </div>
  );
}

type BookingWithRelations = Awaited<
  ReturnType<typeof db.booking.findMany<{
    include: {
      elder: true;
      services: { include: { service: true } };
      assignment: { include: { companion: { include: { user: true } } } };
      payment: true;
    };
  }>>
>[number];

function BookingGroup({ title, bookings }: { title: string; bookings: BookingWithRelations[] }) {
  if (bookings.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="font-bold text-lg text-stone-800 mb-3">{title}</h2>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={bookingStatusTone[booking.status]}>
                    {bookingStatusLabel[booking.status]}
                  </Badge>
                  <span className="text-sm text-stone-500">{booking.code}</span>
                </div>
                <p className="mt-1.5 font-bold text-stone-800">
                  {formatDate(booking.requestedDate)} · {formatTime(booking.requestedTime)}
                </p>
                <p className="text-sm text-stone-600 truncate">
                  {booking.services.map((s) => s.service.name).join(", ")} · {booking.elder.fullName}
                </p>
                {booking.assignment?.status === "ACCEPTED" && (
                  <p className="text-sm text-stone-500">
                    Companion: {booking.assignment.companion.user.name}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary-700">{formatNpr(booking.estimatedNpr)}</p>
                <ButtonLink
                  href={`/family/bookings/${booking.id}`}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Details
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
