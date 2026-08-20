import Link from "next/link";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";
import { BrandLogo } from "@/components/brand";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/services", label: "Services" },
  { href: "/safety", label: "Safety" },
  { href: "/become-a-companion", label: "Become a companion" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Public site header. Shows a dashboard link when logged in. */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="bg-cream/90 backdrop-blur border-b border-stone-200 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="साहारा home">
          <BrandLogo size={34} />
          <span className="text-xl font-bold text-primary-700">
            <span lang="ne">साहारा</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-stone-600 hover:text-primary-700 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <ButtonLink href={homeForRole(user.role)} size="sm">
              My dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="outline" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      {/* Simple mobile nav row */}
      <nav
        aria-label="Main mobile"
        className="lg:hidden overflow-x-auto border-t border-stone-200/70"
      >
        <div className="flex gap-4 px-4 py-2 whitespace-nowrap text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-stone-600 hover:text-primary-700">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
