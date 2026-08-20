"use client";

import { useActionState, useMemo, useState } from "react";
import { createBooking } from "@/lib/actions/bookings";
import { Button, Card, CardBody, FormError, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

type ElderOption = { id: string; fullName: string; nickname: string | null; city: string };
type ServiceOption = {
  id: string;
  name: string;
  nameNe: string | null;
  icon: string;
  description: string;
  basePriceNpr: number;
  estimatedMinutes: number;
  transportRequired: boolean;
  requiresApproval: boolean;
};

const paymentMethods = [
  { value: "INTERNATIONAL_CARD", label: "International card", icon: "💳" },
  { value: "ESEWA", label: "eSewa", icon: "📲" },
  { value: "KHALTI", label: "Khalti", icon: "📲" },
  { value: "MOBILE_BANKING", label: "Mobile banking", icon: "🏦" },
  { value: "REMITTANCE", label: "Remittance-linked", icon: "🌏" },
  { value: "CASH", label: "Cash in Nepal", icon: "💵" },
] as const;

const stepTitles = ["Who is it for?", "What do they need?", "When?", "Review & confirm"];

export function BookingWizard({
  elders,
  services,
  preselectedElderId,
}: {
  elders: ElderOption[];
  services: ServiceOption[];
  preselectedElderId?: string;
}) {
  const [step, setStep] = useState(0);
  const [elderId, setElderId] = useState(
    preselectedElderId && elders.some((e) => e.id === preselectedElderId)
      ? preselectedElderId
      : elders.length === 1
        ? elders[0]!.id
        : "",
  );
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("INTERNATIONAL_CARD");
  // One key per wizard session: double-clicks and retries create one booking.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, formAction] = useActionState(createBooking, undefined);

  const chosenServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds],
  );
  const estimatedNpr = chosenServices.reduce((sum, s) => sum + s.basePriceNpr, 0);
  const durationMin = Math.max(
    60,
    chosenServices.reduce((sum, s) => sum + s.estimatedMinutes, 0),
  );
  const elder = elders.find((e) => e.id === elderId);
  const today = new Date().toISOString().split("T")[0];

  const canContinue =
    step === 0 ? elderId !== "" : step === 1 ? serviceIds.length > 0 : step === 2 ? date !== "" && time !== "" : true;

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <div>
      {/* Progress indicator */}
      <ol className="flex items-center gap-2 mb-6" aria-label="Booking steps">
        {stepTitles.map((title, i) => (
          <li key={title} className="flex-1">
            <div
              className={[
                "h-2 rounded-full",
                i < step ? "bg-leaf-500" : i === step ? "bg-primary-600" : "bg-stone-200",
              ].join(" ")}
            />
            <p
              className={[
                "mt-1.5 text-xs sm:text-sm",
                i === step ? "font-bold text-primary-700" : "text-stone-400",
              ].join(" ")}
              aria-current={i === step ? "step" : undefined}
            >
              {title}
            </p>
          </li>
        ))}
      </ol>

      <Card>
        <CardBody>
          {/* Step 1: elder */}
          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-bold text-stone-800 mb-4">
                Who is this visit for?
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {elders.map((option) => (
                  <label
                    key={option.id}
                    className={[
                      "cursor-pointer rounded-xl border-2 p-4 transition-colors",
                      elderId === option.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-stone-200 hover:border-stone-300",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="elder-choice"
                      className="sr-only"
                      checked={elderId === option.id}
                      onChange={() => setElderId(option.id)}
                    />
                    <span className="font-bold text-stone-800 block">{option.fullName}</span>
                    <span className="text-sm text-stone-500">
                      {option.nickname ? `“${option.nickname}” · ` : ""}
                      {option.city}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Step 2: services */}
          {step === 1 && (
            <fieldset>
              <legend className="text-lg font-bold text-stone-800 mb-1">
                What would help {elder?.nickname || elder?.fullName}?
              </legend>
              <p className="text-sm text-stone-500 mb-4">Choose one or more services.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => {
                  const selected = serviceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className={[
                        "cursor-pointer rounded-xl border-2 p-4 transition-colors flex gap-3",
                        selected
                          ? "border-primary-500 bg-primary-50"
                          : "border-stone-200 hover:border-stone-300",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected}
                        onChange={() => toggleService(service.id)}
                      />
                      <span aria-hidden className="text-2xl">{service.icon}</span>
                      <span className="min-w-0">
                        <span className="font-bold text-stone-800 block">{service.name}</span>
                        <span className="text-sm text-stone-500 block">
                          NPR {service.basePriceNpr.toLocaleString()} · ~
                          {Math.round(service.estimatedMinutes / 60 * 10) / 10} hr
                        </span>
                        {service.requiresApproval && (
                          <span className="text-xs text-amber-700">Reviewed by साहारा first</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Step 3: schedule */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-stone-800">When should the companion visit?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="visit-date">Date</Label>
                  <Input
                    id="visit-date"
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="visit-time">Time (Nepal time)</Label>
                  <Input
                    id="visit-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="visit-instructions">Instructions for the companion</Label>
                <Textarea
                  id="visit-instructions"
                  placeholder="Anything that will make the visit go smoothly — shopping lists, appointment details, topics your parent loves…"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
              <p className="text-sm text-stone-500">
                Estimated duration: about {Math.round((durationMin / 60) * 10) / 10} hours based on
                the services chosen.
              </p>
            </div>
          )}

          {/* Step 4: review + payment + submit */}
          {step === 3 && (
            <form action={formAction} className="space-y-5">
              <h2 className="text-lg font-bold text-stone-800">Review your booking</h2>
              <FormError message={state?.error} />

              <input type="hidden" name="elderId" value={elderId} />
              {serviceIds.map((id) => (
                <input key={id} type="hidden" name="serviceIds" value={id} />
              ))}
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={time} />
              <input type="hidden" name="durationMin" value={durationMin} />
              <input type="hidden" name="instructions" value={instructions} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

              <dl className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-2 text-stone-700">
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold">For</dt>
                  <dd>{elder?.fullName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold">When</dt>
                  <dd>{date} at {time} (NPT)</dd>
                </div>
                <div className="flex justify-between gap-4 items-start">
                  <dt className="font-semibold">Services</dt>
                  <dd className="text-right">
                    {chosenServices.map((s) => (
                      <span key={s.id} className="block">
                        {s.icon} {s.name} — NPR {s.basePriceNpr.toLocaleString()}
                      </span>
                    ))}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-stone-200 pt-2 text-lg">
                  <dt className="font-bold">Estimated total</dt>
                  <dd className="font-bold text-primary-700">NPR {estimatedNpr.toLocaleString()}</dd>
                </div>
              </dl>

              <fieldset>
                <legend className="font-semibold text-stone-700 mb-2">How would you like to pay?</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={[
                        "cursor-pointer rounded-xl border-2 px-3 py-2.5 text-sm text-center transition-colors",
                        paymentMethod === method.value
                          ? "border-primary-500 bg-primary-50 font-semibold"
                          : "border-stone-200 hover:border-stone-300",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        className="sr-only"
                        checked={paymentMethod === method.value}
                        onChange={() => setPaymentMethod(method.value)}
                      />
                      <span aria-hidden className="mr-1">{method.icon}</span>
                      {method.label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Payments are simulated in this demo — no real money moves. Cash is settled in
                  Nepal after the visit.
                </p>
              </fieldset>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  ← Back
                </Button>
                <SubmitButton size="lg" pendingText="Submitting…">
                  Submit booking request
                </SubmitButton>
              </div>
            </form>
          )}

          {/* Wizard navigation (steps 1–3) */}
          {step < 3 && (
            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
              >
                ← Back
              </Button>
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canContinue}>
                Continue →
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
