"use client";

import { useActionState, useRef, useEffect } from "react";
import { sendMessage } from "@/lib/actions/messages";
import { FormError, Input, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function Composer({ threadId }: { threadId: string }) {
  const [state, action] = useActionState(sendMessage, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful send.
  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <FormError message={state?.error} />
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea
        name="body"
        placeholder="Write a message…"
        required
        className="min-h-20"
        aria-label="Message"
      />
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex-1 min-w-44">
          <Input
            name="attachmentName"
            placeholder="Attach image (file name, demo)"
            aria-label="Attachment file name"
          />
        </div>
        <SubmitButton pendingText="Sending…">Send</SubmitButton>
      </div>
    </form>
  );
}
