import type { Metadata } from "next";
import { Card, CardBody, VerifiedBadge } from "@/components/ui";
import { verificationChecklist } from "@/lib/labels";

export const metadata: Metadata = { title: "Safety & verification" };

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
      <h1 className="text-4xl font-extrabold text-stone-800 text-center">
        Safety comes first
      </h1>
      <p className="mt-3 text-lg text-stone-600 text-center max-w-2xl mx-auto">
        We treat every elder like our own parents. That starts with knowing exactly who visits
        their home.
      </p>

      <Card className="mt-12">
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-stone-800">Ten-step companion verification</h2>
            <VerifiedBadge />
          </div>
          <p className="mt-2 text-stone-600">
            A companion can only accept visits after साहारा administrators complete every step
            below and grant final approval.
          </p>
          <ol className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {verificationChecklist.map((item, i) => (
              <li key={item.key} className="flex items-center gap-3 rounded-xl bg-leaf-50 px-4 py-2.5">
                <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-white text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-stone-700 font-medium">{item.label}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800">🆘 Emergency SOS</h2>
            <p className="mt-2 text-stone-600 text-sm">
              Elders and companions can raise an SOS at any time. Alerts appear instantly for
              साहारा support and your family, with one-tap calling to local emergency contacts.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800">🔒 Privacy by default</h2>
            <p className="mt-2 text-stone-600 text-sm">
              Companions see only the care information your family chooses to share. Identity
              documents stay with साहारा administrators and are never shown to other users.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800">🧑‍⚕️ Honest limits</h2>
            <p className="mt-2 text-stone-600 text-sm">
              Companions are caring, trained helpers — not automatically medical professionals.
              Their observations are updates for your family, never medical diagnoses.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800">📞 Real emergencies</h2>
            <p className="mt-2 text-stone-600 text-sm">
              साहारा does not replace police, ambulance, or hospitals. In a life-threatening
              situation always call local emergency services first — Police 100, Ambulance 102.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
