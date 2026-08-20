import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold text-stone-800 text-center">Forgot your password?</h1>
      <p className="mt-2 text-center text-stone-600">
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>
      <Card className="mt-8">
        <CardBody>
          <ForgotPasswordForm />
        </CardBody>
      </Card>
      <p className="mt-5 text-center text-stone-600">
        Remembered it?{" "}
        <Link href="/login" className="text-primary-700 font-semibold underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
