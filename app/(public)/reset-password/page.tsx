import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold text-stone-800 text-center">Choose a new password</h1>
      <Card className="mt-8">
        <CardBody>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-stone-600">
              This page needs a reset link from your email.{" "}
              <Link href="/forgot-password" className="text-primary-700 font-semibold underline">
                Request one here
              </Link>
              .
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
