import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar, Card, CardBody, EmptyState, Input, PageHeader } from "@/components/ui";

export default async function AdminFamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const families = await db.familyProfile.findMany({
    where: q
      ? { user: { OR: [{ name: { contains: q } }, { email: { contains: q } }] } }
      : undefined,
    include: {
      user: true,
      _count: { select: { elders: true, bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Family accounts" subtitle="Families using साहारा from around the world." />
      <form action="/admin/families" method="get" className="flex gap-2 mb-5 max-w-md">
        <Input name="q" placeholder="Search name or email…" defaultValue={q ?? ""} aria-label="Search families" />
        <button type="submit" className="rounded-xl bg-primary-600 text-white font-semibold px-4 hover:bg-primary-700">
          Search
        </button>
      </form>

      {families.length === 0 ? (
        <EmptyState icon="👪" title="No families found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {families.map((family) => (
            <Card key={family.id}>
              <CardBody className="flex items-center gap-4">
                <Avatar name={family.user.name} />
                <div className="min-w-0">
                  <p className="font-bold text-stone-800 truncate">{family.user.name}</p>
                  <p className="text-sm text-stone-500 truncate">{family.user.email}</p>
                  <p className="text-sm text-stone-500">
                    {family.residenceCountry ?? "—"} · {family._count.elders} elder
                    {family._count.elders === 1 ? "" : "s"} · {family._count.bookings} booking
                    {family._count.bookings === 1 ? "" : "s"}
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
