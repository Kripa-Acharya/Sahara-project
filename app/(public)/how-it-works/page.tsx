import type { Metadata } from "next";
import { ButtonLink, Card, CardBody } from "@/components/ui";

export const metadata: Metadata = { title: "How साहारा works" };

const familySteps = [
  { title: "Create your account", body: "Register free from anywhere in the world. It takes about two minutes." },
  { title: "Add your loved one's profile", body: "Address, preferred language, mobility notes, and anything a companion should know. You stay in control of what is shared." },
  { title: "Choose services and a time", body: "Pick one or more services, a date and time, and add instructions. You'll see the estimated price in NPR before submitting." },
  { title: "साहारा assigns a verified companion", body: "Our team matches a background-checked companion who suits your parent's area, language, and needs." },
  { title: "The companion visits", body: "They arrive on time, complete the agreed tasks, and treat your parent like their own family." },
  { title: "You receive a full report", body: "Notes, photos, and updates on wellbeing, food, and medicine — plus the chance to rate the visit." },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
      <h1 className="text-4xl font-extrabold text-stone-800 text-center">How साहारा works</h1>
      <p className="mt-3 text-lg text-stone-600 text-center max-w-2xl mx-auto">
        Being far away doesn&apos;t mean being out of touch. Here is the journey, step by step.
      </p>

      <ol className="mt-12 space-y-5">
        {familySteps.map((step, i) => (
          <li key={step.title}>
            <Card>
              <CardBody className="flex gap-5 items-start">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white font-bold"
                >
                  {i + 1}
                </span>
                <div>
                  <h2 className="font-bold text-lg text-stone-800">{step.title}</h2>
                  <p className="mt-1 text-stone-600">{step.body}</p>
                </div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-10 bg-leaf-50 border-leaf-100">
        <CardBody>
          <h2 className="font-bold text-lg text-stone-800">Prefer to book by phone?</h2>
          <p className="mt-1 text-stone-600">
            Many families and elders prefer a phone call. Call साहारा support at{" "}
            <strong>+977-1-5551000</strong> (demo number) and our team will create the booking for
            you — no app needed.
          </p>
        </CardBody>
      </Card>

      <div className="mt-10 text-center">
        <ButtonLink href="/register" size="lg">Get started</ButtonLink>
      </div>
    </div>
  );
}
