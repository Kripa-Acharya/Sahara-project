import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui";

export const metadata: Metadata = { title: "Contact & support" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <h1 className="text-4xl font-extrabold text-stone-800 text-center">Contact &amp; support</h1>
      <p className="mt-3 text-lg text-stone-600 text-center">
        We answer families in any timezone and elders in plain Nepali.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800">📞 Phone (Nepal)</h2>
            <p className="mt-2 text-stone-700 text-xl font-semibold">+977-1-5551000</p>
            <p className="text-sm text-stone-500">Sunday–Friday, 9am–6pm NPT · demo number</p>
            <p className="mt-3 text-sm text-stone-600">
              Elders and local relatives can book any service by phone — our team enters it for
              them.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800">✉️ Email</h2>
            <p className="mt-2 text-stone-700 text-xl font-semibold">support@sahara.demo</p>
            <p className="text-sm text-stone-500">We reply within one business day · demo address</p>
            <p className="mt-3 text-sm text-stone-600">
              Logged-in families and companions can also message साहारा support directly from
              their dashboard.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6 bg-rose-50 border-rose-100">
        <CardBody>
          <h2 className="font-bold text-lg text-rose-900">In an emergency</h2>
          <p className="mt-1 text-rose-800 text-sm">
            साहारा is not an emergency service. In a life-threatening situation, always contact
            local emergency services first: <strong>Police 100 · Ambulance 102</strong>.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
