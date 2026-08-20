import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { verificationStatusLabel, verificationStatusTone } from "@/lib/labels";
import { Avatar, Badge, Card, CardBody, DescriptionItem, PageHeader } from "@/components/ui";
import { VerificationForm } from "./verification-form";

export default async function AdminCompanionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const companion = await db.companionProfile.findUnique({
    where: { id },
    include: {
      user: true,
      verification: true,
      citizenshipFile: { select: { id: true, originalName: true, status: true } },
      policeReportFile: { select: { id: true, originalName: true, status: true } },
      availability: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
      assignments: {
        where: { status: "ACCEPTED" },
        include: { booking: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!companion || !companion.verification) notFound();

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={companion.user.name}
        subtitle={`Applied ${formatDate(companion.createdAt)} · ${companion.user.email} · ${companion.user.phone ?? "no phone"}`}
        action={
          <Badge tone={verificationStatusTone[companion.verification.status]}>
            {verificationStatusLabel[companion.verification.status]}
          </Badge>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <Avatar name={companion.user.name} size="lg" />
              <div className="flex-1">
                <p className="text-stone-700">{companion.bio || "No bio provided."}</p>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DescriptionItem label="Languages">{companion.languages}</DescriptionItem>
                  <DescriptionItem label="Skills">{companion.skills || "—"}</DescriptionItem>
                  <DescriptionItem label="Service areas">{companion.serviceAreas || "—"}</DescriptionItem>
                  <DescriptionItem label="Rate">NPR {companion.hourlyRateNpr}/hr</DescriptionItem>
                  <DescriptionItem label="Citizenship / ID document">
                    {companion.citizenshipFile ? (
                      <a
                        href={`/api/files/${companion.citizenshipFile.id}`}
                        className="text-primary-700 underline font-medium"
                      >
                        📄 {companion.citizenshipFile.originalName}
                      </a>
                    ) : companion.citizenshipDoc ? (
                      `📄 ${companion.citizenshipDoc} (legacy demo record)`
                    ) : (
                      "Not submitted"
                    )}
                  </DescriptionItem>
                  <DescriptionItem label="Police report">
                    {companion.policeReportFile ? (
                      <a
                        href={`/api/files/${companion.policeReportFile.id}`}
                        className="text-primary-700 underline font-medium"
                      >
                        📄 {companion.policeReportFile.originalName}
                      </a>
                    ) : companion.policeReportDoc ? (
                      `📄 ${companion.policeReportDoc} (legacy demo record)`
                    ) : (
                      "Not submitted"
                    )}
                  </DescriptionItem>
                  <DescriptionItem label="References">
                    {companion.referenceNotes || "—"}
                  </DescriptionItem>
                  <DescriptionItem label="Availability">
                    {companion.availability.length === 0
                      ? "Not set"
                      : companion.availability
                          .map((slot) => `${weekdays[slot.weekday]} ${slot.startTime}–${slot.endTime}`)
                          .join(", ")}
                  </DescriptionItem>
                </dl>
                <p className="mt-3 text-xs text-stone-500">
                  Documents are visible to administrators only (simulated file names in this demo).
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-4">Verification checklist</h2>
            <VerificationForm
              companionId={companion.id}
              verification={companion.verification}
            />
          </CardBody>
        </Card>

        {companion.reviews.length > 0 && (
          <Card>
            <CardBody>
              <h2 className="font-bold text-lg text-stone-800 mb-3">Recent reviews</h2>
              <ul className="space-y-3">
                {companion.reviews.map((review) => (
                  <li key={review.id} className="border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                    <p className="text-amber-600">{"★".repeat(review.rating)}</p>
                    {review.comment && <p className="text-stone-700 text-sm">“{review.comment}”</p>}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
