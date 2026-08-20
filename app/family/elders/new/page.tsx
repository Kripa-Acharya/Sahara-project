import { requireFamily } from "@/lib/auth";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { ElderForm } from "../elder-form";

export default async function NewElderPage() {
  await requireFamily();
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Add your loved one"
        subtitle="This helps us match the right companion and keep every visit safe and personal."
      />
      <Card>
        <CardBody>
          <ElderForm />
        </CardBody>
      </Card>
    </div>
  );
}
