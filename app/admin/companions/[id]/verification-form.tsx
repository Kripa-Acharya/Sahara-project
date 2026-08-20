"use client";

import { useActionState } from "react";
import type { CompanionVerification } from "@prisma/client";
import { updateVerification } from "@/lib/actions/admin";
import { verificationChecklist } from "@/lib/labels";
import { FormError, FormSuccess, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function VerificationForm({
  companionId,
  verification,
}: {
  companionId: string;
  verification: CompanionVerification;
}) {
  const [state, action] = useActionState(updateVerification, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormError message={state?.error} />
      {state && !state.error && <FormSuccess message="Verification saved. The companion has been notified of status changes." />}
      <input type="hidden" name="companionId" value={companionId} />

      <div className="grid gap-2.5 sm:grid-cols-2">
        {verificationChecklist.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-2.5 cursor-pointer hover:bg-stone-50"
          >
            <input
              type="checkbox"
              name={item.key}
              defaultChecked={Boolean(verification[item.key as keyof CompanionVerification])}
              className="size-5 accent-leaf-600"
            />
            <span className="text-stone-700">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="verification-status">Overall status</Label>
          <Select id="verification-status" name="status" defaultValue={verification.status}>
            <option value="INCOMPLETE">Incomplete</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="VERIFIED">Verified ✓</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="verification-notes">Notes for the record</Label>
          <Textarea
            id="verification-notes"
            name="adminNotes"
            defaultValue={verification.adminNotes ?? ""}
            className="min-h-12"
          />
        </div>
      </div>

      <SubmitButton pendingText="Saving…">Save verification</SubmitButton>
    </form>
  );
}
