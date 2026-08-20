"use client";

import { useActionState } from "react";
import { addAvailability } from "@/lib/actions/companion";
import { FormError, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AddAvailabilityForm() {
  const [state, action] = useActionState(addAvailability, undefined);

  return (
    <form action={action} className="space-y-3">
      <FormError message={state?.error} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="avail-day">Day</Label>
          <Select id="avail-day" name="weekday" defaultValue="0">
            {weekdays.map((day, i) => (
              <option key={day} value={i}>
                {day}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="avail-start">From</Label>
          <Input id="avail-start" name="startTime" type="time" defaultValue="09:00" required />
        </div>
        <div>
          <Label htmlFor="avail-end">Until</Label>
          <Input id="avail-end" name="endTime" type="time" defaultValue="17:00" required />
        </div>
      </div>
      <SubmitButton pendingText="Adding…">Add availability</SubmitButton>
    </form>
  );
}
