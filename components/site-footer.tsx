import Link from "next/link";
import { BrandLogo, SkylineAccent } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <SkylineAccent />
      <div className="border-t border-line bg-cream-dark">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-primary-700">
              <BrandLogo size={28} />
              <span lang="ne">साहारा</span>
            </p>
            <p lang="ne" className="mt-3 text-sm text-primary-700 font-medium">
              तपाईं टाढा भए पनि तपाईंको माया जहिले सँगै हुन्छ।
            </p>
            <p className="mt-1 text-sm text-stone-600 max-w-xs">
              You may be far. Your care does not have to be.
            </p>
          </div>
          <div>
            <p className="font-semibold text-stone-700 mb-2.5">Families</p>
            <ul className="space-y-2 text-sm text-stone-600">
              <li><Link className="hover:text-primary-700" href="/how-it-works">How साहारा works</Link></li>
              <li><Link className="hover:text-primary-700" href="/services">Services</Link></li>
              <li><Link className="hover:text-primary-700" href="/safety">Safety &amp; verification</Link></li>
              <li><Link className="hover:text-primary-700" href="/register">Create an account</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-stone-700 mb-2.5">Companions</p>
            <ul className="space-y-2 text-sm text-stone-600">
              <li><Link className="hover:text-primary-700" href="/become-a-companion">Become a companion</Link></li>
              <li><Link className="hover:text-primary-700" href="/about">About साहारा</Link></li>
              <li><Link className="hover:text-primary-700" href="/contact">Contact &amp; support</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-stone-700 mb-2.5">Important</p>
            <p className="text-sm text-stone-600">
              साहारा does not replace police, ambulance, medical, or emergency services. In a
              life-threatening situation, call local emergency services first — Police 100,
              Ambulance 102.
            </p>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-sm text-stone-500">
          © {new Date().getFullYear()} साहारा (demo MVP). Testimonials and people shown are fictional.
        </div>
      </div>
    </footer>
  );
}
