"use client";

import { useActionState, useMemo, useState } from "react";
import { createPhoneBooking } from "@/lib/actions/admin";
import { FieldHint, FormError, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type ElderOption = { id: string; fullName: string; city: string; familyName: string };
type ServiceOption = { id: string; name: string; icon: string; basePriceNpr: number };
type CompanionOption = { id: string; name: string };

export function PhoneBookingForm({
  elders,
  services,
  companions,
}: {
  elders: ElderOption[];
  services: ServiceOption[];
  companions: CompanionOption[];
}) {
  const [state, action] = useActionState(createPhoneBooking, undefined);
  const [mode, setMode] = useState<"existing" | "new">(elders.length > 0 ? "existing" : "new");
  const [elderSearch, setElderSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const filteredElders = useMemo(
    () =>
      elders.filter((elder) =>
        `${elder.fullName} ${elder.city} ${elder.familyName}`
          .toLowerCase()
          .includes(elderSearch.toLowerCase()),
      ),
    [elders, elderSearch],
  );

  const estimated = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.basePriceNpr, 0);

  return (
    <form action={action} className="space-y-6">
      <FormError message={state?.error} />

      {/* Caller */}
      <fieldset className="space-y-3">
        <legend className="font-bold text-stone-800">1 · Who is calling?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pb-caller-name">Caller&apos;s name *</Label>
            <Input id="pb-caller-name" name="callerName" required />
          </div>
          <div>
            <Label htmlFor="pb-caller-phone">Caller&apos;s phone *</Label>
            <Input id="pb-caller-phone" name="callerPhone" type="tel" required />
          </div>
        </div>
      </fieldset>

      {/* Elder */}
      <fieldset className="space-y-3">
        <legend className="font-bold text-stone-800">2 · Who is the visit for?</legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border-2 ${mode === "existing" ? "border-primary-500 bg-primary-50" : "border-stone-200"}`}
          >
            Existing elder
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border-2 ${mode === "new" ? "border-primary-500 bg-primary-50" : "border-stone-200"}`}
          >
            New elder
          </button>
        </div>

        {mode === "existing" ? (
          <div className="space-y-2">
            <Input
              placeholder="Search elders by name, city, or family…"
              value={elderSearch}
              onChange={(e) => setElderSearch(e.target.value)}
              aria-label="Search elders"
            />
            <Select name="elderId" defaultValue="" aria-label="Choose elder">
              <option value="">Choose an elder…</option>
              {filteredElders.map((elder) => (
                <option key={elder.id} value={elder.id}>
                  {elder.fullName} — {elder.city} (family: {elder.familyName})
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pb-elder-name">Elder&apos;s full name *</Label>
              <Input id="pb-elder-name" name="newElderName" />
            </div>
            <div>
              <Label htmlFor="pb-elder-city">City *</Label>
              <Input id="pb-elder-city" name="newElderCity" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pb-elder-address">Home address *</Label>
              <Input id="pb-elder-address" name="newElderAddress" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pb-family-email">Family account email (if known)</Label>
              <Input id="pb-family-email" name="familyEmail" type="email" />
              <FieldHint>
                If a family account exists, the booking is linked to it and they get a
                confirmation. Otherwise साहारा manages it internally.
              </FieldHint>
            </div>
          </div>
        )}
      </fieldset>

      {/* Services */}
      <fieldset className="space-y-3">
        <legend className="font-bold text-stone-800">3 · Requested services *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <label
              key={service.id}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 cursor-pointer text-sm ${
                selectedServices.includes(service.id)
                  ? "border-primary-500 bg-primary-50"
                  : "border-stone-200"
              }`}
            >
              <input
                type="checkbox"
                name="serviceIds"
                value={service.id}
                checked={selectedServices.includes(service.id)}
                onChange={() =>
                  setSelectedServices((prev) =>
                    prev.includes(service.id)
                      ? prev.filter((id) => id !== service.id)
                      : [...prev, service.id],
                  )
                }
                className="size-4 accent-primary-600"
              />
              <span aria-hidden>{service.icon}</span>
              {service.name}
              <span className="ml-auto text-stone-500">NPR {service.basePriceNpr.toLocaleString()}</span>
            </label>
          ))}
        </div>
        {estimated > 0 && (
          <p className="text-sm font-semibold text-primary-700">
            Estimated total: NPR {estimated.toLocaleString()}
          </p>
        )}
      </fieldset>

      {/* Schedule + payment + assignment */}
      <fieldset className="space-y-3">
        <legend className="font-bold text-stone-800">4 · Schedule & payment</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="pb-date">Date *</Label>
            <Input id="pb-date" name="date" type="date" required />
          </div>
          <div>
            <Label htmlFor="pb-time">Time (NPT) *</Label>
            <Input id="pb-time" name="time" type="time" required defaultValue="10:00" />
          </div>
          <div>
            <Label htmlFor="pb-payment">Payment *</Label>
            <Select id="pb-payment" name="paymentChoice" defaultValue="CASH">
              <option value="CASH">Cash in Nepal</option>
              <option value="FAMILY">Family pays online</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="pb-companion">Assign companion now (optional)</Label>
            <Select id="pb-companion" name="companionId" defaultValue="">
              <option value="">Assign later</option>
              {companions.map((companion) => (
                <option key={companion.id} value={companion.id}>
                  {companion.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="pb-instructions">Special instructions</Label>
          <Textarea id="pb-instructions" name="instructions" />
        </div>
      </fieldset>

      <SubmitButton size="lg" pendingText="Creating booking…">
        Create phone booking
      </SubmitButton>
    </form>
  );
}
