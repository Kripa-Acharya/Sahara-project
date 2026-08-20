import { notFound } from "next/navigation";
import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { removeEmergencyContact } from "@/lib/actions/elders";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  DescriptionItem,
  PageHeader,
} from "@/components/ui";
import { AddContactForm } from "./add-contact-form";

export default async function ElderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireFamily();
  const { id } = await params;

  const elder = await db.elderProfile.findFirst({
    where: { id, familyId: profile.id },
    include: { emergencyContacts: { orderBy: { isPrimary: "desc" } } },
  });
  if (!elder) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={elder.fullName}
        subtitle={elder.nickname ? `“${elder.nickname}” · ${elder.city}` : elder.city}
        action={
          <div className="flex gap-2">
            <ButtonLink href={`/family/elders/${elder.id}/edit`} variant="outline">Edit</ButtonLink>
            <ButtonLink href={`/family/book?elder=${elder.id}`}>Book a visit</ButtonLink>
          </div>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={elder.fullName} size="lg" />
              <div>
                {elder.age && <Badge tone="bg-stone-100 text-stone-700">{elder.age} years</Badge>}{" "}
                <Badge tone="bg-sky-100 text-sky-800">
                  Speaks {elder.preferredLanguage === "ne" ? "Nepali" : "English"}
                </Badge>
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DescriptionItem label="Address">
                {elder.addressLine}, {elder.city}
                {elder.district ? `, ${elder.district}` : ""}
              </DescriptionItem>
              <DescriptionItem label="Finding the home">
                {elder.locationNotes || "—"}
              </DescriptionItem>
              <DescriptionItem label="Mobility">{elder.mobilityNotes || "—"}</DescriptionItem>
              <DescriptionItem label="Health notes">{elder.healthNotes || "—"}</DescriptionItem>
              <DescriptionItem label="Preferences">{elder.serviceNotes || "—"}</DescriptionItem>
            </dl>
          </CardBody>
        </Card>

        <Card className="bg-leaf-50 border-leaf-100">
          <CardBody>
            <h2 className="font-bold text-stone-800">Elder screen access</h2>
            <p className="mt-1 text-sm text-stone-600">
              On any phone, tablet or computer, open <strong>/elder</strong> and enter this code so{" "}
              {elder.nickname || elder.fullName} can see the next visit and reach help with one big
              button:
            </p>
            <p className="mt-2 text-2xl font-mono font-bold tracking-widest text-leaf-700">
              {elder.elderAccessCode}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">Emergency contacts</h2>
            {elder.emergencyContacts.length === 0 && (
              <p className="text-stone-500 text-sm mb-3">
                No contacts yet. Add at least one local contact who can reach{" "}
                {elder.nickname || "them"} quickly.
              </p>
            )}
            <ul className="space-y-3 mb-5">
              {elder.emergencyContacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-stone-800">
                      {contact.name}{" "}
                      {contact.isPrimary && <Badge tone="bg-primary-100 text-primary-800">Primary</Badge>}{" "}
                      {contact.isLocal ? (
                        <Badge tone="bg-leaf-100 text-leaf-700">Local</Badge>
                      ) : (
                        <Badge tone="bg-sky-100 text-sky-800">Abroad</Badge>
                      )}
                    </p>
                    <p className="text-sm text-stone-500">
                      {contact.relation} · {contact.phone}
                    </p>
                  </div>
                  <form action={removeEmergencyContact}>
                    <input type="hidden" name="contactId" value={contact.id} />
                    <button
                      type="submit"
                      className="text-sm text-rose-600 hover:underline"
                      aria-label={`Remove ${contact.name}`}
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <AddContactForm elderId={elder.id} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
