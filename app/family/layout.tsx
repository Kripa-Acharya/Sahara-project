import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const nav: NavItem[] = [
  { href: "/family", label: "Home", icon: "🏠" },
  { href: "/family/elders", label: "My Elders", icon: "👵" },
  { href: "/family/book", label: "Book a Visit", icon: "📅" },
  { href: "/family/bookings", label: "Bookings", icon: "🗒️" },
  { href: "/family/reports", label: "Visit Reports", icon: "📖" },
  { href: "/family/messages", label: "Messages", icon: "💬" },
  { href: "/family/payments", label: "Payments", icon: "💳" },
  { href: "/family/settings", label: "Settings", icon: "⚙️" },
];

export default async function FamilyLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("FAMILY");
  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  );
}
