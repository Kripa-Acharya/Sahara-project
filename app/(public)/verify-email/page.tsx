import type { Metadata } from "next";
import { verifyEmailToken } from "@/lib/actions/auth";
import { ButtonLink, Card, CardBody } from "@/components/ui";

export const metadata: Metadata = { title: "Email verification" };

/**
 * Landing page for the emailed verification link. The token itself authorizes
 * the operation (single-use, hashed, expiring), so a GET click-through is the
 * expected UX.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailToken(token) : false;

  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <Card>
        <CardBody className="py-10">
          {verified ? (
            <>
              <p aria-hidden className="text-5xl mb-3">✅</p>
              <h1 className="text-2xl font-bold text-stone-800">Email confirmed</h1>
              <p className="mt-2 text-stone-600">
                Thank you — we can now reach you with visit updates and safety alerts.
              </p>
              <ButtonLink href="/login" className="mt-6">Continue</ButtonLink>
            </>
          ) : (
            <>
              <p aria-hidden className="text-5xl mb-3">⏳</p>
              <h1 className="text-2xl font-bold text-stone-800">This link isn&apos;t valid</h1>
              <p className="mt-2 text-stone-600">
                It may have expired or already been used. Log in and request a new
                verification email from your dashboard.
              </p>
              <ButtonLink href="/login" variant="outline" className="mt-6">Log in</ButtonLink>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
