"use client";

import { useActionState } from "react";
import { resolveAlert } from "@/lib/actions/admin";
import { FormError, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ResolveAlertForm({ alertId }: { alertId: string }) {
  const [state, action] = useActionState(resolveAlert, undefined);

  return (
    <form action={action} className="space-y-2">
      <FormError message={state?.error} />
      <input type="hidden" name="alertId" value={alertId} />
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-56">
          <Input
            name="resolvedNote"
            placeholder="How was this resolved? (required — the family sees this)"
            required
            aria-label="Resolution note"
          />
        </div>
        <SubmitButton variant="leaf" size="sm" pendingText="Resolving…">
          Mark resolved
        </SubmitButton>
      </div>
    </form>
  );
}
