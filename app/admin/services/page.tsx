import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ServiceEditor } from "./service-editor";

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await db.service.findMany({ orderBy: { basePriceNpr: "asc" } });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Services & pricing" subtitle="Edit prices, availability, and add new services." />
      <ServiceEditor
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          nameNe: s.nameNe,
          description: s.description,
          icon: s.icon,
          estimatedMinutes: s.estimatedMinutes,
          basePriceNpr: s.basePriceNpr,
          transportRequired: s.transportRequired,
          requiresApproval: s.requiresApproval,
          isActive: s.isActive,
        }))}
      />
    </div>
  );
}
