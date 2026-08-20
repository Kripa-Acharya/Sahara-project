"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ensureSupportThread } from "@/lib/actions/messages";
import { Button } from "@/components/ui";

/** Opens (creating if needed) the user's direct thread with साहारा support. */
export function SupportThreadButton({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const threadId = await ensureSupportThread();
          router.push(`${basePath}/messages/${threadId}`);
        })
      }
    >
      {pending ? "Opening…" : "💬 Message साहारा support"}
    </Button>
  );
}
