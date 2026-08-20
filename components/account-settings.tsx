"use client";

import { useActionState } from "react";
import { changePassword, updateAccount } from "@/lib/actions/settings";
import { Card, CardBody, FormError, FormSuccess, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

/** Shared account settings forms (name/phone + password) for all roles. */
export function AccountSettings({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const [profileState, profileAction] = useActionState(updateAccount, undefined);
  const [passwordState, passwordAction] = useActionState(changePassword, undefined);

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardBody>
          <h2 className="font-bold text-lg text-stone-800 mb-4">Account details</h2>
          <form action={profileAction} className="space-y-4">
            <FormError message={profileState?.error} />
            {profileState && !profileState.error && <FormSuccess message="Saved." />}
            <div>
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" value={email} disabled aria-readonly />
            </div>
            <div>
              <Label htmlFor="settings-name">Full name</Label>
              <Input id="settings-name" name="name" defaultValue={name} required />
            </div>
            <div>
              <Label htmlFor="settings-phone">Phone</Label>
              <Input id="settings-phone" name="phone" type="tel" defaultValue={phone ?? ""} required />
            </div>
            <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="font-bold text-lg text-stone-800 mb-4">Change password</h2>
          <form action={passwordAction} className="space-y-4">
            <FormError message={passwordState?.error} />
            {passwordState && !passwordState.error && <FormSuccess message="Password updated." />}
            <div>
              <Label htmlFor="settings-current">Current password</Label>
              <Input id="settings-current" name="current" type="password" autoComplete="current-password" required />
            </div>
            <div>
              <Label htmlFor="settings-next">New password</Label>
              <Input id="settings-next" name="next" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            <SubmitButton pendingText="Updating…">Update password</SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
