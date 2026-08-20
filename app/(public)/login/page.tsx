import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));
  const { reset } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold text-stone-800 text-center">Welcome back</h1>
      <p className="mt-2 text-center text-stone-600">Log in to your साहारा account.</p>

      {reset && (
        <p className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 text-sm text-center">
          Your password has been changed. Please log in with your new password.
        </p>
      )}

      <Card className="mt-8">
        <CardBody>
          <LoginForm />
          <p className="mt-3 text-center text-sm">
            <Link href="/forgot-password" className="text-primary-700 underline">
              Forgot your password?
            </Link>
          </p>
        </CardBody>
      </Card>

      <p className="mt-5 text-center text-stone-600">
        New to साहारा?{" "}
        <Link href="/register" className="text-primary-700 font-semibold underline">
          Create an account
        </Link>
      </p>

      <Card className="mt-8 bg-amber-50 border-amber-200">
        <CardBody className="text-sm text-amber-900">
          <p className="font-bold mb-1">Demo accounts</p>
          <ul className="space-y-0.5 font-mono text-xs sm:text-sm">
            <li>family@sahara.demo / Family@123</li>
            <li>companion@sahara.demo / Companion@123</li>
            <li>admin@sahara.demo / Admin@123</li>
          </ul>
          <p className="mt-2">
            Elder screen: visit <Link href="/elder" className="underline font-semibold">/elder</Link> with
            access code <strong>SAHARA1</strong>.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
