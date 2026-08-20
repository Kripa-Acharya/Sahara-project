import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar, ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";

export default async function EldersPage() {
  const { profile } = await requireFamily();
  const elders = await db.elderProfile.findMany({
    where: { familyId: profile.id },
    include: { _count: { select: { bookings: true, emergencyContacts: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="My elders"
        subtitle="The loved ones you care for through साहारा."
        action={<ButtonLink href="/family/elders/new">+ Add elder</ButtonLink>}
      />

      {elders.length === 0 ? (
        <EmptyState
          icon="👵"
          title="No elder profiles yet"
          body="Create a profile for your parent or relative in Nepal to start booking visits."
          action={<ButtonLink href="/family/elders/new">Create elder profile</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {elders.map((elder) => (
            <Card key={elder.id}>
              <CardBody>
                <div className="flex items-center gap-4">
                  <Avatar name={elder.fullName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg text-stone-800 truncate">{elder.fullName}</h2>
                    <p className="text-stone-500 text-sm">
                      {elder.city}
                      {elder.age ? ` · ${elder.age} years` : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-stone-600">
                  {elder._count.bookings} booking{elder._count.bookings === 1 ? "" : "s"} ·{" "}
                  {elder._count.emergencyContacts} emergency contact
                  {elder._count.emergencyContacts === 1 ? "" : "s"}
                </p>
                <div className="mt-4 flex gap-2">
                  <ButtonLink href={`/family/elders/${elder.id}`} variant="secondary" size="sm">
                    View profile
                  </ButtonLink>
                  <ButtonLink href={`/family/book?elder=${elder.id}`} size="sm">
                    Book a visit
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
