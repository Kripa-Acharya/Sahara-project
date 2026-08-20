import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { BookingWizard } from "./booking-wizard";

export default async function BookVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ elder?: string }>;
}) {
  const { profile } = await requireFamily();
  const { elder: preselectedElderId } = await searchParams;

  const [elders, services] = await Promise.all([
    db.elderProfile.findMany({ where: { familyId: profile.id }, orderBy: { createdAt: "asc" } }),
    db.service.findMany({ where: { isActive: true }, orderBy: { basePriceNpr: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Book a visit"
        subtitle="Four small steps — you'll see the estimated price before anything is confirmed."
      />
      {elders.length === 0 ? (
        <EmptyState
          icon="👵"
          title="First, add your loved one"
          body="We need an elder profile before booking a visit."
          action={<ButtonLink href="/family/elders/new">Create elder profile</ButtonLink>}
        />
      ) : (
        <BookingWizard
          elders={elders.map((e) => ({
            id: e.id,
            fullName: e.fullName,
            city: e.city,
            nickname: e.nickname,
          }))}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            nameNe: s.nameNe,
            icon: s.icon,
            description: s.description,
            basePriceNpr: s.basePriceNpr,
            estimatedMinutes: s.estimatedMinutes,
            transportRequired: s.transportRequired,
            requiresApproval: s.requiresApproval,
          }))}
          preselectedElderId={preselectedElderId}
        />
      )}
    </div>
  );
}
