"use client";

import { useActionState } from "react";
import type { BookingStatus, PaymentStatus } from "@prisma/client";
import { assignCompanion, updateBookingStatus, updatePaymentStatus } from "@/lib/actions/admin";
import { bookingStatusLabel, paymentStatusLabel } from "@/lib/labels";
import { FormError, FormSuccess, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AssignCompanionForm({
  bookingId,
  companions,
  hasAssignment,
}: {
  bookingId: string;
  companions: { id: string; name: string; areas: string | null }[];
  hasAssignment: boolean;
}) {
  const [state, action] = useActionState(assignCompanion, undefined);

  return (
    <form action={action} className="space-y-3">
      <FormError message={state?.error} />
      {state && !state.error && <FormSuccess message="Companion assigned and notified." />}
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-56">
          <label htmlFor="assign-companion" className="block text-sm font-semibold text-stone-700 mb-1.5">
            {hasAssignment ? "Reassign to" : "Assign verified companion"}
          </label>
          <Select id="assign-companion" name="companionId" defaultValue="">
            <option value="" disabled>Choose a companion…</option>
            {companions.map((companion) => (
              <option key={companion.id} value={companion.id}>
                {companion.name}
                {companion.areas ? ` — ${companion.areas}` : ""}
              </option>
            ))}
          </Select>
        </div>
        <SubmitButton pendingText="Assigning…">
          {hasAssignment ? "Reassign" : "Assign"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function BookingStatusForm({
  bookingId,
  current,
}: {
  bookingId: string;
  current: BookingStatus;
}) {
  const [state, action] = useActionState(updateBookingStatus, undefined);

  return (
    <form action={action} className="space-y-2">
      <FormError message={state?.error} />
      {state && !state.error && <FormSuccess message="Status updated." />}
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-wrap gap-3 items-center">
        <Select name="status" defaultValue={current} className="w-auto" aria-label="Booking status">
          {Object.entries(bookingStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <div className="flex-1 min-w-48">
          <Input name="reason" placeholder="Reason (required, audit-logged)" required minLength={5} aria-label="Reason for status change" />
        </div>
        <SubmitButton variant="outline" pendingText="Updating…">Update</SubmitButton>
      </div>
    </form>
  );
}

export function PaymentStatusForm({
  paymentId,
  current,
}: {
  paymentId: string;
  current: PaymentStatus;
}) {
  const [state, action] = useActionState(updatePaymentStatus, undefined);

  return (
    <form action={action} className="space-y-2">
      <FormError message={state?.error} />
      {state && !state.error && <FormSuccess message="Payment status updated." />}
      <input type="hidden" name="paymentId" value={paymentId} />
      <div className="flex flex-wrap gap-3 items-center">
        <Select name="status" defaultValue={current} className="w-auto" aria-label="Payment status">
          {Object.entries(paymentStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <div className="flex-1 min-w-48">
          <Input name="reason" placeholder="Reason (required, audit-logged)" required minLength={5} aria-label="Reason for payment change" />
        </div>
        <SubmitButton variant="outline" pendingText="Updating…">Update payment</SubmitButton>
      </div>
    </form>
  );
}
