import type { Metadata } from "next";
import { ButtonLink, Card, CardBody } from "@/components/ui";

export const metadata: Metadata = { title: "Become a companion" };

const reasons = [
  { icon: "❤️", title: "Meaningful work", body: "Bring company and practical help to elders whose children live far away." },
  { icon: "🕐", title: "Flexible hours", body: "Set your own weekly availability and service areas. Accept only the visits that suit you." },
  { icon: "💰", title: "Fair earnings", body: "Transparent per-visit pay in NPR, tracked in your dashboard, with no hidden fees." },
  { icon: "🎓", title: "Training & support", body: "Orientation and emergency-procedure training before your first visit, and साहारा support behind you always." },
];

const requirements = [
  "Nepali citizenship or valid ID",
  "A recent police report",
  "Two references we can call",
  "A phone we can reach you on",
  "Patience, warmth, and respect for elders",
];

export default function BecomeCompanionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
      <h1 className="text-4xl font-extrabold text-stone-800 text-center">
        Become a साहारा companion
      </h1>
      <p className="mt-3 text-lg text-stone-600 text-center max-w-2xl mx-auto">
        Join a community of trusted local helpers making sure no elder in Nepal feels alone.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {reasons.map((reason) => (
          <Card key={reason.title}>
            <CardBody>
              <span aria-hidden className="text-3xl">{reason.icon}</span>
              <h2 className="mt-2 font-bold text-lg text-stone-800">{reason.title}</h2>
              <p className="mt-1 text-stone-600 text-sm">{reason.body}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardBody>
          <h2 className="font-bold text-lg text-stone-800">What you&apos;ll need</h2>
          <ul className="mt-3 space-y-2">
            {requirements.map((req) => (
              <li key={req} className="flex items-center gap-3 text-stone-700">
                <span aria-hidden className="text-leaf-600 font-bold">✓</span> {req}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-500">
            After you apply, साहारा completes a ten-step verification including an interview and
            orientation. Most applicants finish within one to two weeks.
          </p>
        </CardBody>
      </Card>

      <div className="mt-10 text-center">
        <ButtonLink href="/register?role=companion" size="lg">Apply now</ButtonLink>
        <p className="mt-3 text-sm text-stone-500">
          Questions first? <a href="/contact" className="text-primary-700 underline">Contact us</a>.
        </p>
      </div>
    </div>
  );
}
