import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui";

export const metadata: Metadata = { title: "About साहारा" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <h1 className="text-4xl font-extrabold text-stone-800 text-center">About साहारा</h1>
      <p className="mt-3 text-center text-lg text-stone-600">
        <em lang="ne">साहारा</em> means <strong>support</strong> in Nepali.
      </p>

      <div className="mt-10 space-y-6 text-stone-700 leading-relaxed">
        <p>
          Hundreds of thousands of Nepali families live split across continents. Children build
          lives in Sydney, London, or Dallas, while their parents grow older in Kathmandu,
          Pokhara, and villages across the country. Love doesn&apos;t fade with distance — but
          everyday help does.
        </p>
        <p>
          साहारा exists to close that gap. We connect elders with verified local companions who
          can share a cup of tea, pick up medicines, stand in the pension queue, or simply make
          sure a video call to the grandchildren actually connects.
        </p>
        <p>
          Every visit ends with a report to the family — because peace of mind matters as much as
          the visit itself.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3 text-center">
        <Card><CardBody><p className="text-3xl">🤲</p><p className="mt-2 font-bold text-stone-800">Dignity</p><p className="text-sm text-stone-600">Elders are respected guests of honour, never tasks on a list.</p></CardBody></Card>
        <Card><CardBody><p className="text-3xl">🔍</p><p className="mt-2 font-bold text-stone-800">Trust</p><p className="text-sm text-stone-600">Verification, reports, and honest limits on what we do.</p></CardBody></Card>
        <Card><CardBody><p className="text-3xl">🌏</p><p className="mt-2 font-bold text-stone-800">Connection</p><p className="text-sm text-stone-600">Families stay close, across every timezone.</p></CardBody></Card>
      </div>

      <p className="mt-10 text-sm text-stone-500 text-center">
        This application is a demonstration MVP. People, testimonials, and contact details are
        fictional.
      </p>
    </div>
  );
}
