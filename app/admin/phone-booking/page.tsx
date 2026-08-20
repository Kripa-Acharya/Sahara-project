import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { PhoneBookingForm } from "./phone-booking-form";

export default async function PhoneBookingPage() {
  await requireAdmin();

  const [elders, services, companions] = await Promise.all([
    db.elderProfile.findMany({
      include: { family: { include: { user: true } } },
      orderBy: { fullName: "asc" },
    }),
    db.service.findMany({ where: { isActive: true }, orderBy: { basePriceNpr: "asc" } }),
    db.companionProfile.findMany({
      where: { verification: { status: "VERIFIED" }, user: { isActive: true } },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Phone booking"
        subtitle="Create a booking for a caller who doesn't use the app — an elder, a local relative, or family abroad."
      />
      <Card>
        <CardBody>
          <PhoneBookingForm
            elders={elders.map((e) => ({
              id: e.id,
              fullName: e.fullName,
              city: e.city,
              familyName: e.family.user.name,
            }))}
            services={services.map((s) => ({
              id: s.id,
              name: s.name,
              icon: s.icon,
              basePriceNpr: s.basePriceNpr,
            }))}
            companions={companions.map((c) => ({ id: c.id, name: c.user.name }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
