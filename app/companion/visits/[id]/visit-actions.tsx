"use client";

import { useActionState, useState } from "react";
import {
  completeVisit,
  reportIncident,
  respondToAssignment,
  startVisit,
} from "@/lib/actions/companion";
import { raiseCompanionSos } from "@/lib/actions/sos";
import { Button, FormError, FormSuccess, Input, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AcceptRejectForms({ assignmentId }: { assignmentId: string }) {
  const [state, action] = useActionState(respondToAssignment, undefined);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="space-y-3">
      <FormError message={state?.error} />
      {!rejecting ? (
        <div className="flex flex-wrap gap-3">
          <form action={action}>
            <input type="hidden" name="assignmentId" value={assignmentId} />
            <input type="hidden" name="response" value="accept" />
            <SubmitButton variant="leaf" size="lg" pendingText="Accepting…">
              ✓ Accept visit
            </SubmitButton>
          </form>
          <Button variant="outline" size="lg" onClick={() => setRejecting(true)}>
            Decline
          </Button>
        </div>
      ) : (
        <form action={action} className="space-y-3">
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="response" value="reject" />
          <Textarea
            name="rejectReason"
            placeholder="Why can't you take this visit? This helps साहारा reassign quickly."
          />
          <div className="flex gap-2">
            <SubmitButton variant="danger" pendingText="Declining…">
              Decline visit
            </SubmitButton>
            <Button type="button" variant="outline" onClick={() => setRejecting(false)}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function StartVisitButton({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(startVisit, undefined);
  return (
    <form action={action}>
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton size="lg" pendingText="Starting…">
        ▶ Start visit
      </SubmitButton>
    </form>
  );
}

export function CompleteVisitButton({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(completeVisit, undefined);
  return (
    <form action={action}>
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton variant="leaf" size="lg" pendingText="Completing…">
        ✓ Complete visit
      </SubmitButton>
    </form>
  );
}

export function CompanionSosButton({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(raiseCompanionSos, undefined);
  const [open, setOpen] = useState(false);

  if (state && !state.error) {
    return <FormSuccess message="SOS sent. साहारा support and the family have been alerted." />;
  }

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)}>
        🆘 SOS
      </Button>
    );
  }

  return (
    <form action={action} className="w-full space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="text-sm text-rose-800 font-semibold">
        In a life-threatening emergency call Police 100 / Ambulance 102 first.
      </p>
      <Input name="description" placeholder="What is happening? (optional)" />
      <div className="flex gap-2">
        <SubmitButton variant="danger" size="sm" pendingText="Sending…">
          Send SOS alert
        </SubmitButton>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function IncidentForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(reportIncident, undefined);
  const [open, setOpen] = useState(false);

  if (state && !state.error) {
    return <FormSuccess message="Thank you. साहारा support will review this concern." />;
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        ⚠️ Report a concern
      </Button>
    );
  }

  return (
    <form action={action} className="w-full space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <p className="font-semibold text-stone-800">Report a concern or incident</p>
      <FormError message={state?.error} />
      <input type="hidden" name="bookingId" value={bookingId} />
      <Input name="title" placeholder="Short title" required />
      <Textarea name="description" placeholder="Describe what happened…" required />
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Sending…">Submit</SubmitButton>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
