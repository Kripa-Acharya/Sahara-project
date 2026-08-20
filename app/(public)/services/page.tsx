import type { Metadata } from "next";
import { ButtonLink, Badge, Card, CardBody } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDuration, formatNpr } from "@/lib/format";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { basePriceNpr: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <h1 className="text-4xl font-extrabold text-stone-800 text-center">Our services</h1>
      <p className="mt-3 text-lg text-stone-600 text-center max-w-2xl mx-auto">
        Every service is carried out by a verified companion, with a report to your family
        afterwards. Prices are base estimates in Nepali rupees.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardBody className="flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden className="text-4xl">{service.icon}</span>
                <div className="text-right">
                  <p className="font-bold text-primary-700">{formatNpr(service.basePriceNpr)}</p>
                  <p className="text-sm text-stone-500">~{formatDuration(service.estimatedMinutes)}</p>
                </div>
              </div>
              <h2 className="mt-3 font-bold text-lg text-stone-800">{service.name}</h2>
              {service.nameNe && <p className="text-stone-500">{service.nameNe}</p>}
              <p className="mt-2 text-stone-600 text-sm flex-1">{service.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.transportRequired && (
                  <Badge tone="bg-sky-100 text-sky-800">🚕 Transport may be needed</Badge>
                )}
                {service.requiresApproval && (
                  <Badge tone="bg-amber-100 text-amber-800">Reviewed by साहारा first</Badge>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-stone-500 max-w-2xl mx-auto">
        Final prices can vary with duration and transport. You always see the estimate before
        confirming, and साहारा reviews any unusual requests.
      </p>
      <div className="mt-6 text-center">
        <ButtonLink href="/register" size="lg">Book a visit</ButtonLink>
      </div>
    </div>
  );
}
