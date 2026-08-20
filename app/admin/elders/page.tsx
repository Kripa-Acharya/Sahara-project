import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar, Card, CardBody, EmptyState, Input, PageHeader } from "@/components/ui";

export default async function AdminEldersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const elders = await db.elderProfile.findMany({
    where: q
      ? { OR: [{ fullName: { contains: q } }, { city: { contains: q } }] }
      : undefined,
    include: {
      family: { include: { user: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Elders" subtitle="Every elder cared for through साहारा." />
      <form action="/admin/elders" method="get" className="flex gap-2 mb-5 max-w-md">
        <Input name="q" placeholder="Search name or city…" defaultValue={q ?? ""} aria-label="Search elders" />
        <button type="submit" className="rounded-xl bg-primary-600 text-white font-semibold px-4 hover:bg-primary-700">
          Search
        </button>
      </form>

      {elders.length === 0 ? (
        <EmptyState icon="👵" title="No elders found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {elders.map((elder) => (
            <Card key={elder.id}>
              <CardBody className="flex items-center gap-4">
                <Avatar name={elder.fullName} />
                <div className="min-w-0">
                  <p className="font-bold text-stone-800 truncate">{elder.fullName}</p>
                  <p className="text-sm text-stone-500 truncate">
                    {elder.addressLine}, {elder.city}
                  </p>
                  <p className="text-sm text-stone-500">
                    Family: {elder.family.user.name} · {elder._count.bookings} booking
                    {elder._count.bookings === 1 ? "" : "s"}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
