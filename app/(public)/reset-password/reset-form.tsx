"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { FieldHint, FormError, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="reset-password">New password</Label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <FieldHint>At least 8 characters. All existing sessions will be signed out.</FieldHint>
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}
