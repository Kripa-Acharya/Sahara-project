import { requireCompanion } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { AccountSettings } from "@/components/account-settings";
import { ActiveSessions } from "@/components/active-sessions";
import { CompanionProfileForm } from "./profile-form";
import { DocumentUploads } from "./document-uploads";

export default async function CompanionProfilePage() {
  const { user, profile } = await requireCompanion();

  const fileIds = [profile.citizenshipFileId, profile.policeReportFileId].filter(
    (id): id is string => Boolean(id),
  );
  const files = fileIds.length
    ? await db.storedFile.findMany({
        where: { id: { in: fileIds }, status: "AVAILABLE" },
        select: { id: true, originalName: true },
      })
    : [];
  const fileById = (id: string | null) => files.find((f) => f.id === id) ?? null;

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" subtitle="Your public details and verification documents." />

      <div className="space-y-6">
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-4">Companion profile</h2>
            <CompanionProfileForm
              profile={{
                bio: profile.bio,
                languages: profile.languages,
                skills: profile.skills,
                serviceAreas: profile.serviceAreas,
                citizenshipDoc: profile.citizenshipDoc,
                policeReportDoc: profile.policeReportDoc,
                referenceNotes: profile.referenceNotes,
              }}
            />
            <div className="mt-5">
              <DocumentUploads
                citizenship={fileById(profile.citizenshipFileId)}
                policeReport={fileById(profile.policeReportFileId)}
              />
            </div>
          </CardBody>
        </Card>

        <AccountSettings name={user.name} phone={user.phone} email={user.email} />
        <ActiveSessions />
      </div>
    </div>
  );
}
