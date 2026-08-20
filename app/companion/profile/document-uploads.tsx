"use client";

import { useActionState } from "react";
import { uploadVerificationDocument } from "@/lib/actions/files";
import { FieldHint, FormError, FormSuccess, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type CurrentDoc = { id: string; originalName: string } | null;

function UploadSlot({
  slot,
  label,
  current,
}: {
  slot: "citizenship" | "policeReport";
  label: string;
  current: CurrentDoc;
}) {
  const [state, action] = useActionState(uploadVerificationDocument, undefined);
  const inputId = `upload-${slot}`;

  return (
    <form action={action} className="space-y-2">
      <FormError message={state?.error} />
      {state?.ok && <FormSuccess message="Document uploaded — साहारा will review it." />}
      <input type="hidden" name="slot" value={slot} />
      <Label htmlFor={inputId}>{label}</Label>
      {current && (
        <p className="text-sm text-stone-600">
          Currently on file:{" "}
          <a
            href={`/api/files/${current.id}`}
            className="text-primary-700 underline font-medium"
          >
            📄 {current.originalName}
          </a>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          required
          className="text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-800 hover:file:bg-primary-100"
        />
        <SubmitButton size="sm" variant="secondary" pendingText="Uploading…">
          {current ? "Replace" : "Upload"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function DocumentUploads({
  citizenship,
  policeReport,
}: {
  citizenship: CurrentDoc;
  policeReport: CurrentDoc;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-5">
      <div>
        <p className="font-semibold text-stone-700">Verification documents</p>
        <FieldHint>
          PDF, JPG, or PNG up to 5 MB. Stored privately — visible only to you and साहारा
          administrators, never to families or other users.
        </FieldHint>
      </div>
      <UploadSlot slot="citizenship" label="Citizenship / ID document" current={citizenship} />
      <UploadSlot slot="policeReport" label="Police report" current={policeReport} />
    </div>
  );
}
