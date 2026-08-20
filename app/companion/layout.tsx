import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const nav: NavItem[] = [
  { href: "/companion", label: "Home", icon: "🏠" },
  { href: "/companion/visits", label: "My Visits", icon: "🤝" },
  { href: "/companion/availability", label: "Availability", icon: "🗓️" },
  { href: "/companion/reports", label: "Reports", icon: "📖" },
  { href: "/companion/earnings", label: "Earnings", icon: "💰" },
  { href: "/companion/messages", label: "Messages", icon: "💬" },
  { href: "/companion/verification", label: "Verification", icon: "🛡️" },
  { href: "/companion/profile", label: "Profile", icon: "👤" },
];

export default async function CompanionLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("COMPANION");
  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  );
}
