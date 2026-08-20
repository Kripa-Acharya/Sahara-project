"use client";

import { useActionState, useState } from "react";
import { register } from "@/lib/actions/auth";
import { FieldHint, FormError, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function RegisterForm({ defaultRole }: { defaultRole: "FAMILY" | "COMPANION" }) {
  const [state, action] = useActionState(register, undefined);
  const [role, setRole] = useState<"FAMILY" | "COMPANION">(defaultRole);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />

      <fieldset>
        <legend className="block text-sm font-semibold text-stone-700 mb-2">I am joining as</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(
            [
              { value: "FAMILY", label: "Family member", hint: "I want to book care for a loved one" },
              { value: "COMPANION", label: "Companion", hint: "I want to help elders in Nepal" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={[
                "cursor-pointer rounded-xl border-2 p-3 text-center transition-colors",
                role === option.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-stone-200 hover:border-stone-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="font-bold text-stone-800 block">{option.label}</span>
              <span className="text-xs text-stone-500">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
        <FieldHint>Include the country code, e.g. +61 or +977.</FieldHint>
      </div>
      <div>
        <Label htmlFor="country">{role === "FAMILY" ? "Country you live in" : "City / area in Nepal"}</Label>
        <Input
          id="country"
          name="country"
          placeholder={role === "FAMILY" ? "e.g. Australia" : "e.g. Lalitpur"}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <FieldHint>At least 8 characters.</FieldHint>
      </div>

      <SubmitButton className="w-full" size="lg" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
