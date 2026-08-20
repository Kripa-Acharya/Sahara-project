import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));
  const { role } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold text-stone-800 text-center">Create your account</h1>
      <p className="mt-2 text-center text-stone-600">
        Whether you&apos;re caring for family abroad or helping elders locally — welcome.
      </p>

      <Card className="mt-8">
        <CardBody>
          <RegisterForm defaultRole={role === "companion" ? "COMPANION" : "FAMILY"} />
        </CardBody>
      </Card>

      <p className="mt-5 text-center text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-700 font-semibold underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
