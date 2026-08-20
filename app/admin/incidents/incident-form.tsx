"use client";

import { useActionState } from "react";
import type { IncidentStatus } from "@prisma/client";
import { updateIncident } from "@/lib/actions/admin";
import { FormError, FormSuccess, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function IncidentStatusForm({
  incidentId,
  current,
}: {
  incidentId: string;
  current: IncidentStatus;
}) {
  const [state, action] = useActionState(updateIncident, undefined);

  return (
    <form action={action} className="space-y-2">
      <FormError message={state?.error} />
      {state && !state.error && <FormSuccess message="Incident updated." />}
      <input type="hidden" name="incidentId" value={incidentId} />
      <div className="flex flex-wrap gap-2 items-center">
        <Select name="status" defaultValue={current} className="w-auto" aria-label="Incident status">
          <option value="OPEN">Open</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </Select>
        <div className="flex-1 min-w-48">
          <Input name="resolution" placeholder="Resolution note…" aria-label="Resolution note" />
        </div>
        <SubmitButton variant="outline" size="sm" pendingText="Saving…">Update</SubmitButton>
      </div>
    </form>
  );
}
