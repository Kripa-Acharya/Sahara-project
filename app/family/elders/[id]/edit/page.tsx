import { notFound } from "next/navigation";
import { requireFamily } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { ElderForm } from "../../elder-form";

export default async function EditElderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireFamily();
  const { id } = await params;
  const elder = await db.elderProfile.findFirst({ where: { id, familyId: profile.id } });
  if (!elder) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${elder.fullName}`} />
      <Card>
        <CardBody>
          <ElderForm elder={elder} />
        </CardBody>
      </Card>
    </div>
  );
}
