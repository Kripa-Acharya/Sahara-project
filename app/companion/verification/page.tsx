import { requireCompanion } from "@/lib/auth";
import { verificationChecklist, verificationStatusLabel, verificationStatusTone } from "@/lib/labels";
import { Badge, ButtonLink, Card, CardBody, PageHeader, VerifiedBadge } from "@/components/ui";
import type { CompanionVerification } from "@prisma/client";

export default async function VerificationPage() {
  const { profile } = await requireCompanion();
  const verification = profile.verification;

  if (!verification) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Verification" />
        <Card><CardBody>Verification record not found. Please contact साहारा support.</CardBody></Card>
      </div>
    );
  }

  const completedSteps = verificationChecklist.filter(
    (item) => verification[item.key as keyof CompanionVerification],
  ).length;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Verification checklist"
        subtitle="Families trust साहारा because every companion completes these steps."
        action={
          verification.status === "VERIFIED" ? (
            <VerifiedBadge />
          ) : (
            <Badge tone={verificationStatusTone[verification.status]}>
              {verificationStatusLabel[verification.status]}
            </Badge>
          )
        }
      />

      <Card className="mb-5">
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-stone-700">
              {completedSteps} of {verificationChecklist.length} steps complete
            </p>
          </div>
          <div className="h-3 rounded-full bg-stone-200 overflow-hidden" role="progressbar"
            aria-valuenow={completedSteps} aria-valuemin={0} aria-valuemax={verificationChecklist.length}>
            <div
              className="h-full bg-leaf-500 transition-all"
              style={{ width: `${(completedSteps / verificationChecklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-5 space-y-2.5">
            {verificationChecklist.map((item) => {
              const done = Boolean(verification[item.key as keyof CompanionVerification]);
              return (
                <li key={item.key} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={[
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      done ? "bg-leaf-600 text-white" : "bg-stone-200 text-stone-400",
                    ].join(" ")}
                  >
                    {done ? "✓" : "•"}
                  </span>
                  <span className={done ? "text-stone-800" : "text-stone-500"}>{item.label}</span>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {verification.adminNotes && (
        <Card className="mb-5 bg-amber-50 border-amber-200">
          <CardBody>
            <p className="font-semibold text-amber-900">Note from साहारा</p>
            <p className="text-amber-800 text-sm mt-1">{verification.adminNotes}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-stone-600 text-sm max-w-md">
            Document steps (ID, police report) are completed from your profile page. Interview and
            orientation are arranged by the साहारा team.
          </p>
          <ButtonLink href="/companion/profile" variant="secondary" size="sm">
            Update documents
          </ButtonLink>
        </CardBody>
      </Card>
    </div>
  );
}
