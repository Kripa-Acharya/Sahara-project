"use client";

import { useActionState } from "react";
import type { ElderProfile } from "@prisma/client";
import { createElder, updateElder } from "@/lib/actions/elders";
import { FieldHint, FormError, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

/** Shared create/edit form for an elder profile. */
export function ElderForm({ elder }: { elder?: ElderProfile }) {
  const [state, action] = useActionState(elder ? updateElder : createElder, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormError message={state?.error} />
      {elder && <input type="hidden" name="elderId" value={elder.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name *</Label>
          <Input id="fullName" name="fullName" required defaultValue={elder?.fullName} />
        </div>
        <div>
          <Label htmlFor="nickname">What they like to be called</Label>
          <Input id="nickname" name="nickname" placeholder="e.g. Aama, Buwa" defaultValue={elder?.nickname ?? ""} />
        </div>
        <div>
          <Label htmlFor="age">Age</Label>
          <Input id="age" name="age" type="number" min={1} max={120} defaultValue={elder?.age ?? ""} />
        </div>
        <div>
          <Label htmlFor="preferredLanguage">Preferred language *</Label>
          <Select id="preferredLanguage" name="preferredLanguage" defaultValue={elder?.preferredLanguage ?? "ne"}>
            <option value="ne">Nepali</option>
            <option value="en">English</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="addressLine">Home address *</Label>
        <Input id="addressLine" name="addressLine" required defaultValue={elder?.addressLine} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input id="city" name="city" required defaultValue={elder?.city} placeholder="e.g. Kathmandu" />
        </div>
        <div>
          <Label htmlFor="district">District</Label>
          <Input id="district" name="district" defaultValue={elder?.district ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="locationNotes">How to find the home</Label>
        <Input
          id="locationNotes"
          name="locationNotes"
          placeholder="Landmarks, gate colour, directions…"
          defaultValue={elder?.locationNotes ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="mobilityNotes">Mobility</Label>
        <Textarea
          id="mobilityNotes"
          name="mobilityNotes"
          placeholder="e.g. Walks with a cane, avoids stairs…"
          defaultValue={elder?.mobilityNotes ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="healthNotes">Health notes the companion should know</Label>
        <Textarea
          id="healthNotes"
          name="healthNotes"
          placeholder="Only what's needed for a safe visit — e.g. daily medicines, hearing difficulty…"
          defaultValue={elder?.healthNotes ?? ""}
        />
        <FieldHint>
          Share the minimum needed. Companions are helpers, not medical professionals.
        </FieldHint>
      </div>
      <div>
        <Label htmlFor="serviceNotes">Preferences &amp; personality</Label>
        <Textarea
          id="serviceNotes"
          name="serviceNotes"
          placeholder="Tea at 4pm, loves talking about football, prefers morning visits…"
          defaultValue={elder?.serviceNotes ?? ""}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-leaf-50 border border-leaf-100 p-4 cursor-pointer">
        <input type="checkbox" name="consentToShare" required defaultChecked={elder?.consentToShare} className="mt-1 size-5 accent-leaf-600" />
        <span className="text-sm text-stone-700">
          I consent to साहारा sharing this care information with the verified companion assigned
          to each visit. Identity documents are never shared. *
        </span>
      </label>

      <SubmitButton size="lg" pendingText="Saving…">
        {elder ? "Save changes" : "Create profile"}
      </SubmitButton>
    </form>
  );
}
