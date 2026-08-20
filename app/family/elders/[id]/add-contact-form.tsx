"use client";

import { useActionState } from "react";
import { addEmergencyContact } from "@/lib/actions/elders";
import { FormError, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AddContactForm({ elderId }: { elderId: string }) {
  const [state, action] = useActionState(addEmergencyContact, undefined);

  return (
    <form action={action} className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-3">
      <p className="font-semibold text-stone-700">Add a contact</p>
      <FormError message={state?.error} />
      <input type="hidden" name="elderId" value={elderId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="contact-relation">Relationship</Label>
          <Input id="contact-relation" name="relation" placeholder="e.g. Brother" required />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" name="phone" type="tel" required />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isLocal" defaultChecked className="size-4 accent-leaf-600" />
          Lives in Nepal
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isPrimary" className="size-4 accent-primary-600" />
          Primary contact
        </label>
        <SubmitButton size="sm" variant="secondary" pendingText="Adding…">
          Add contact
        </SubmitButton>
      </div>
    </form>
  );
}
