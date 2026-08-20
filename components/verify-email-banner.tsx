import type { User } from "@prisma/client";
import { resendVerificationEmail } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";

/** Gentle reminder shown in dashboards until the email address is confirmed. */
export function VerifyEmailBanner({ user }: { user: User }) {
  if (user.emailVerifiedAt) return null;
  return (
    <div className="bg-mustard-100 border-b border-amber-200 px-4 py-2.5">
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2 text-sm text-amber-900">
        <p>
          📮 Please confirm your email so visit updates and safety alerts reach you. We sent a
          link to <strong>{user.email}</strong>.
        </p>
        <form action={resendVerificationEmail}>
          <SubmitButton variant="ghost" size="sm" className="text-amber-900 underline" pendingText="Sending…">
            Resend email
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
