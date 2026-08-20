"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { FormError, FormSuccess, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <FormSuccess message="If an account exists for that email, a reset link is on its way. In development, check the storage/dev-mailbox/ folder." />
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />
      <div>
        <Label htmlFor="forgot-email">Email address</Label>
        <Input id="forgot-email" name="email" type="email" autoComplete="email" required />
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
