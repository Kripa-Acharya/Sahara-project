"use client";

import { useActionState } from "react";
import { updateCompanionProfile } from "@/lib/actions/companion";
import { FieldHint, FormError, FormSuccess, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type ProfileFields = {
  bio: string | null;
  languages: string;
  skills: string | null;
  serviceAreas: string | null;
  citizenshipDoc: string | null;
  policeReportDoc: string | null;
  referenceNotes: string | null;
};

export function CompanionProfileForm({ profile }: { profile: ProfileFields }) {
  const [state, action] = useActionState(updateCompanionProfile, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />
      {state && !state.error && <FormSuccess message="Profile saved." />}

      <div>
        <Label htmlFor="profile-bio">About you</Label>
        <Textarea
          id="profile-bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          placeholder="Families read this — share who you are and why you love this work."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="profile-languages">Languages</Label>
          <Input
            id="profile-languages"
            name="languages"
            defaultValue={profile.languages}
            placeholder="e.g. ne,en,new"
          />
          <FieldHint>Comma-separated codes or names.</FieldHint>
        </div>
        <div>
          <Label htmlFor="profile-areas">Service areas</Label>
          <Input
            id="profile-areas"
            name="serviceAreas"
            defaultValue={profile.serviceAreas ?? ""}
            placeholder="e.g. Lalitpur, Kathmandu"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="profile-skills">Skills</Label>
        <Input
          id="profile-skills"
          name="skills"
          defaultValue={profile.skills ?? ""}
          placeholder="e.g. companionship, errands, technology-help"
        />
      </div>

      <div>
        <Label htmlFor="profile-references">References</Label>
        <Textarea
          id="profile-references"
          name="referenceNotes"
          defaultValue={profile.referenceNotes ?? ""}
          placeholder="Two people साहारा can call — name, relationship, phone."
        />
      </div>

      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}
