"use client";

import { useActionState, useState } from "react";
import type { PaymentMethod } from "@prisma/client";
import { cancelBooking, payBooking, submitReview } from "@/lib/actions/bookings";
import { Button, FormError, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

/** Simulated payment form (demo provider). */
export function PayForm({
  bookingId,
  currentMethod,
}: {
  bookingId: string;
  currentMethod: PaymentMethod;
}) {
  const [state, action] = useActionState(payBooking, undefined);

  return (
    <form action={action} className="space-y-3">
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label htmlFor="pay-method" className="block text-sm font-semibold text-stone-700 mb-1.5">
            Payment method
          </label>
          <Select id="pay-method" name="method" defaultValue={currentMethod}>
            <option value="INTERNATIONAL_CARD">International card</option>
            <option value="ESEWA">eSewa</option>
            <option value="KHALTI">Khalti</option>
            <option value="MOBILE_BANKING">Mobile banking</option>
            <option value="REMITTANCE">Remittance-linked</option>
            <option value="CASH">Cash in Nepal (pay after visit)</option>
          </Select>
        </div>
        <SubmitButton pendingText="Processing…">Pay now (demo)</SubmitButton>
      </div>
      <p className="text-xs text-stone-500">
        This is a simulated demo payment — no card details are needed and no real money moves.
      </p>
    </form>
  );
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);

  return (
    <form action={action} className="space-y-3">
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5 stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => setRating(star)}
            className="text-3xl transition-transform hover:scale-110"
          >
            {star <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <Textarea name="comment" placeholder="Share a few words about the visit (optional)…" />
      <SubmitButton pendingText="Submitting…" disabled={rating === 0}>
        Submit review
      </SubmitButton>
    </form>
  );
}

export function CancelBookingForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(cancelBooking, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cancel this booking
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <Textarea name="reason" placeholder="Why are you cancelling? (optional)" />
      <div className="flex gap-2">
        <SubmitButton variant="danger" size="sm" pendingText="Cancelling…">
          Yes, cancel booking
        </SubmitButton>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Keep booking
        </Button>
      </div>
    </form>
  );
}
