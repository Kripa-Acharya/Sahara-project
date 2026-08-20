import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { verificationStatusLabel, verificationStatusTone } from "@/lib/labels";
import { Avatar, Badge, ButtonLink, Card, CardBody, EmptyState, Input, PageHeader } from "@/components/ui";

export default async function AdminCompanionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  await requireAdmin();
  const { q, tab } = await searchParams;
  const applicationsOnly = tab === "applications";

  const companions = await db.companionProfile.findMany({
    where: {
      ...(applicationsOnly
        ? { verification: { status: { in: ["INCOMPLETE", "UNDER_REVIEW"] } } }
        : {}),
      ...(q ? { user: { name: { contains: q } } } : {}),
    },
    include: {
      user: true,
      verification: true,
      _count: { select: { assignments: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Companions"
        subtitle="Applications, verification, and the companion directory."
      />

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex rounded-xl border border-stone-200 overflow-hidden">
          <ButtonLink
            href="/admin/companions"
            variant={applicationsOnly ? "ghost" : "secondary"}
            size="sm"
            className="rounded-none"
          >
            All companions
          </ButtonLink>
          <ButtonLink
            href="/admin/companions?tab=applications"
            variant={applicationsOnly ? "secondary" : "ghost"}
            size="sm"
            className="rounded-none"
          >
            Applications
          </ButtonLink>
        </div>
        <form action="/admin/companions" method="get" className="flex gap-2 flex-1 min-w-52">
          {applicationsOnly && <input type="hidden" name="tab" value="applications" />}
          <Input name="q" placeholder="Search by name…" defaultValue={q ?? ""} aria-label="Search companions" />
          <button type="submit" className="rounded-xl bg-primary-600 text-white font-semibold px-4 hover:bg-primary-700">
            Search
          </button>
        </form>
      </div>

      {companions.length === 0 ? (
        <EmptyState icon="🤝" title="No companions found" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companions.map((companion) => (
            <Card key={companion.id}>
              <CardBody>
                <div className="flex items-center gap-3">
                  <Avatar name={companion.user.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-stone-800 truncate">{companion.user.name}</p>
                    <p className="text-sm text-stone-500 truncate">
                      {companion.serviceAreas || "No areas set"}
                    </p>
                  </div>
                  <Badge tone={verificationStatusTone[companion.verification?.status ?? "INCOMPLETE"]}>
                    {verificationStatusLabel[companion.verification?.status ?? "INCOMPLETE"]}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-stone-600">
                  {companion._count.assignments} assignment{companion._count.assignments === 1 ? "" : "s"} ·{" "}
                  {companion._count.reviews} review{companion._count.reviews === 1 ? "" : "s"} · NPR{" "}
                  {companion.hourlyRateNpr}/hr
                </p>
                <ButtonLink
                  href={`/admin/companions/${companion.id}`}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                >
                  Review & verify
                </ButtonLink>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
