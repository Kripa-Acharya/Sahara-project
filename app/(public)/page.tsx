import { ButtonLink, Card, CardBody, VerifiedBadge } from "@/components/ui";
import { NepaliPatternDivider } from "@/components/brand";
import { HeroCareIllustration, VideoCallIllustration } from "@/components/illustrations";
import { db } from "@/lib/db";
import { formatNpr } from "@/lib/format";

const steps = [
  { icon: "👵", title: "Tell us about your loved one", body: "Create a simple profile for your parent — where they live, what they need, and what makes them smile." },
  { icon: "📅", title: "Book a visit", body: "Choose services, a date and time, and add any instructions. See the estimated price before you confirm." },
  { icon: "🤝", title: "A verified companion visits", body: "साहारा assigns a background-checked local companion. You can message them any time." },
  { icon: "📖", title: "Get a full report", body: "After every visit you receive notes, photos, and updates on food, medicine, and wellbeing." },
];

const trustPoints = [
  { icon: "🛡️", title: "Verified companions", body: "Citizenship check, police report, references, interview, and orientation — before their first visit." },
  { icon: "📸", title: "Reports after every visit", body: "Notes and photographs, so you always know how the visit went — wherever you are in the world." },
  { icon: "💬", title: "Direct messaging", body: "Talk with the companion and साहारा support from Australia, the US, the UK — anywhere." },
  { icon: "🆘", title: "Emergency alerts", body: "A simple SOS button for your parent, with instant alerts to family and साहारा support." },
];

const testimonials = [
  { name: "Prakash, Melbourne (fictional)", body: "Aama's face lights up when her companion visits. The photo reports let me feel close, even from Australia." },
  { name: "Sarita, London (fictional)", body: "Buwa needed help with his pension paperwork. It was done in one afternoon — with a full report and receipts." },
  { name: "Deepak, Texas (fictional)", body: "The weekly video-call assistance means my kids actually talk to their hajurbuwa now. Priceless." },
];

export default async function LandingPage() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { basePriceNpr: "asc" },
    take: 6,
  });

  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 pb-10 grid gap-10 lg:grid-cols-2 items-center">
          <div className="text-center lg:text-left">
            <p lang="ne" className="text-4xl sm:text-5xl font-bold text-primary-700">
              साहारा
            </p>
            <h1 lang="ne" className="mt-5 text-2xl sm:text-3xl font-bold text-coral-600 text-balance">
              तपाईं टाढा भए पनि तपाईंको माया जहिले सँगै हुन्छ।
            </h1>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-800 text-balance">
              You may be far. Your care does not have to be.
            </p>
            <p className="mt-5 text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 text-balance">
              Arrange trusted companionship and everyday assistance for your parents in Nepal,
              wherever you are in the world.
            </p>
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
              <ButtonLink href="/register" size="lg">Find care for my parents</ButtonLink>
              <ButtonLink href="/become-a-companion" variant="outline" size="lg">
                Become a verified companion
              </ButtonLink>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-leaf-600">✓</span> Verified &amp; trained companions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-leaf-600">✓</span> Visit reports with photos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="text-leaf-600">✓</span> Kathmandu Valley · NPR pricing
              </span>
            </div>
          </div>
          <HeroCareIllustration className="w-full max-w-md mx-auto lg:max-w-full animate-rise" />
        </div>
        <NepaliPatternDivider className="pb-6" />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-3xl font-bold text-stone-800 text-center">
          How साहारा works
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card key={step.title}>
              <CardBody>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="text-3xl">{step.icon}</span>
                  <span className="rounded-full bg-primary-50 text-primary-700 text-sm font-bold px-3 py-0.5">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-stone-800">{step.title}</h3>
                <p className="mt-1.5 text-stone-600 text-sm">{step.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <ButtonLink href="/how-it-works" variant="secondary">Learn more</ButtonLink>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white border-y border-line" aria-labelledby="services-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <h2 id="services-heading" className="text-3xl font-bold text-stone-800 text-center">
            Help with the things that matter
          </h2>
          <p className="mt-2 text-center text-stone-500">
            From a friendly cup of tea to hospital visits — one trusted person for it all.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <span aria-hidden className="text-3xl">{service.icon}</span>
                    <span className="text-sm font-semibold text-primary-700">
                      from {formatNpr(service.basePriceNpr)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-stone-800">{service.name}</h3>
                  {service.nameNe && (
                    <p lang="ne" className="text-sm text-stone-500">{service.nameNe}</p>
                  )}
                  <p className="mt-1 text-sm text-stone-600">{service.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/services" variant="secondary">See all services</ButtonLink>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14" aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="text-3xl font-bold text-stone-800 text-center">
          Why families trust साहारा
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex gap-4 rounded-[22px] bg-mist-50 border border-mist-100 p-5">
              <span aria-hidden className="text-3xl shrink-0">{point.icon}</span>
              <div>
                <h3 className="font-bold text-stone-800">{point.title}</h3>
                <p className="mt-1 text-stone-600">{point.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <VerifiedBadge />
        </div>
        <p className="mt-3 text-center text-sm text-stone-500 max-w-xl mx-auto">
          Every companion completes a ten-step verification before earning this badge —{" "}
          <a href="/safety" className="text-primary-700 underline">see how verification works</a>.
        </p>
      </section>

      {/* Families abroad + elder-friendly */}
      <section className="bg-leaf-50 border-y border-leaf-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 grid gap-10 lg:grid-cols-2 items-center">
          <VideoCallIllustration className="w-full max-w-xs mx-auto" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h2 className="text-2xl font-bold text-stone-800">Built for families abroad</h2>
              <p className="mt-3 text-stone-600">
                Book from any timezone, pay with international cards or Nepali wallets, and stay
                in the loop with visit reports and messages. साहारा speaks your language — and
                your parents&apos;.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">Gentle with elders</h2>
              <p className="mt-3 text-stone-600">
                Your parent doesn&apos;t need a smartphone or an app. A simple large-button screen
                in Nepali and English shows their next visit and a one-touch SOS — and bookings
                can always be made for them by family or by phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14" aria-labelledby="stories-heading">
        <h2 id="stories-heading" className="text-3xl font-bold text-stone-800 text-center">
          Stories from families
        </h2>
        <p className="mt-1 text-center text-sm text-stone-400">
          Illustrative demo content — these testimonials are fictional.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name}>
              <CardBody>
                <span aria-hidden className="text-coral-400 text-2xl leading-none">❝</span>
                <p className="mt-1 text-stone-700">{item.body}</p>
                <p className="mt-4 text-sm font-semibold text-stone-500">— {item.name}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center">
          <p lang="ne" className="text-primary-100 text-lg">
            तपाईं टाढा भए पनि तपाईंको माया जहिले सँगै हुन्छ।
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white text-balance">
            Give your parents a friendly hand — and yourself peace of mind.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" size="lg" className="bg-white text-primary-800 hover:bg-primary-50">
              Find care for my parents
            </ButtonLink>
            <ButtonLink href="/become-a-companion" size="lg" variant="ghost" className="text-white hover:bg-primary-600">
              Become a verified companion →
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
