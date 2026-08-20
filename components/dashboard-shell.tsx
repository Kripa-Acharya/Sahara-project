import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui";
import { BrandLogo } from "@/components/brand";
import { VerifyEmailBanner } from "@/components/verify-email-banner";

export type NavItem = { href: string; label: string; icon: string };

/**
 * Shared dashboard chrome for family / companion / admin areas.
 * Sidebar on desktop, horizontal scroll nav on mobile.
 */
export async function DashboardShell({
  user,
  nav,
  accent,
  children,
}: {
  user: User;
  nav: NavItem[];
  accent?: ReactNode;
  children: ReactNode;
}) {
  const unread = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white">
        <Link href="/" className="px-5 py-4 border-b border-stone-200 flex items-center gap-2.5">
          <BrandLogo size={28} />
          <span lang="ne" className="font-bold text-primary-700 text-lg">साहारा</span>
        </Link>
        <nav aria-label="Dashboard" className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-stone-600 hover:bg-primary-50 hover:text-primary-800 font-medium"
            >
              <span aria-hidden className="text-lg w-6 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-stone-200 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-stone-800 truncate">{user.name}</p>
              <form action={logout}>
                <button className="text-sm text-stone-500 hover:text-primary-700" type="submit">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold text-primary-700 flex items-center gap-2">
              <BrandLogo size={24} />
              <span lang="ne">साहारा</span>
            </Link>
            <div className="flex items-center gap-3">
              <NotificationsLink unread={unread} nav={nav} />
              <form action={logout}>
                <button className="text-sm text-stone-500" type="submit">Log out</button>
              </form>
            </div>
          </div>
          <nav aria-label="Dashboard mobile" className="overflow-x-auto border-t border-stone-100">
            <div className="flex gap-1 px-2 py-1.5 whitespace-nowrap">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-primary-50"
                >
                  <span aria-hidden className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-end gap-4 px-6 py-3 border-b border-stone-200 bg-white/60">
          <NotificationsLink unread={unread} nav={nav} />
          <span className="text-sm text-stone-500">
            Namaste, <strong className="text-stone-700">{user.name.split(" ")[0]}</strong>
          </span>
        </header>

        <VerifyEmailBanner user={user} />
        {accent}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NotificationsLink({ unread, nav }: { unread: number; nav: NavItem[] }) {
  // Notifications live under the role's base path, e.g. /family/notifications
  const base = nav[0]?.href ?? "/";
  const root = "/" + base.split("/")[1];
  return (
    <Link
      href={`${root}/notifications`}
      className="relative text-xl"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
    >
      <span aria-hidden>🔔</span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-2 rounded-full bg-rose-600 text-white text-xs font-bold px-1.5 min-w-5 text-center">
          {unread}
        </span>
      )}
    </Link>
  );
}
