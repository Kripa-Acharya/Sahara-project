"use client";

import { useActionState } from "react";
import { submitVisitReport } from "@/lib/actions/companion";
import { FieldHint, FormError, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ReportForm({
  bookingId,
  serviceNames,
}: {
  bookingId: string;
  serviceNames: string[];
}) {
  const [state, action] = useActionState(submitVisitReport, undefined);

  return (
    <form action={action} className="space-y-5">
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="report-arrival">Arrival time</Label>
          <Input id="report-arrival" name="arrivalTime" type="time" />
        </div>
        <div>
          <Label htmlFor="report-departure">Departure time</Label>
          <Input id="report-departure" name="departureTime" type="time" />
        </div>
      </div>

      <div>
        <Label htmlFor="report-tasks">Tasks completed *</Label>
        <Textarea
          id="report-tasks"
          name="tasksCompleted"
          required
          placeholder={`e.g. ${serviceNames.join(", ")} — what was done?`}
        />
      </div>
      <div>
        <Label htmlFor="report-wellbeing">General wellbeing *</Label>
        <Textarea
          id="report-wellbeing"
          name="wellbeingNote"
          required
          placeholder="How did they seem — mood, energy, appetite?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="report-food">Food & groceries</Label>
          <Textarea id="report-food" name="foodNote" />
        </div>
        <div>
          <Label htmlFor="report-medicine">Medicine</Label>
          <Textarea id="report-medicine" name="medicineNote" />
        </div>
        <div>
          <Label htmlFor="report-appointment">Appointments</Label>
          <Textarea id="report-appointment" name="appointmentNote" />
        </div>
        <div>
          <Label htmlFor="report-household">Household concerns</Label>
          <Textarea id="report-household" name="householdConcern" />
        </div>
      </div>

      <div>
        <Label htmlFor="report-safety">Safety concerns</Label>
        <Textarea id="report-safety" name="safetyConcern" placeholder="Leave empty if none." />
      </div>
      <div>
        <Label htmlFor="report-notes">Your notes to the family</Label>
        <Textarea
          id="report-notes"
          name="companionNotes"
          placeholder="A personal note — what you talked about, what made them smile…"
        />
      </div>

      <div>
        <Label htmlFor="report-photos">Photographs</Label>
        <Input
          id="report-photos"
          name="photoNames"
          placeholder="e.g. tea-time.jpg, garden.jpg"
        />
        <FieldHint>
          Demo: enter image file names separated by commas — real uploads come with production
          storage.
        </FieldHint>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 text-stone-700">
          <input type="checkbox" name="followUpRecommended" className="size-5 accent-primary-600" />
          I recommend a follow-up visit or family attention
        </label>
        <label className="flex items-center gap-3 text-stone-700">
          <input type="checkbox" name="incidentReported" className="size-5 accent-rose-600" />
          Something happened that साहारा should review (creates an incident)
        </label>
      </div>

      <SubmitButton size="lg" pendingText="Submitting…">
        Submit report to family
      </SubmitButton>
    </form>
  );
}
