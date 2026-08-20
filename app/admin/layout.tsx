import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const nav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/bookings", label: "Bookings", icon: "🗒️" },
  { href: "/admin/phone-booking", label: "Phone Booking", icon: "📞" },
  { href: "/admin/companions", label: "Companions", icon: "🤝" },
  { href: "/admin/elders", label: "Elders", icon: "👵" },
  { href: "/admin/families", label: "Families", icon: "👪" },
  { href: "/admin/services", label: "Services", icon: "🛠️" },
  { href: "/admin/reports", label: "Reports", icon: "📖" },
  { href: "/admin/emergencies", label: "Emergencies", icon: "🆘" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/incidents", label: "Incidents", icon: "⚠️" },
  { href: "/admin/messages", label: "Messages", icon: "💬" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("ADMIN");
  return (
    <DashboardShell user={user} nav={nav}>
      {children}
    </DashboardShell>
  );
}
