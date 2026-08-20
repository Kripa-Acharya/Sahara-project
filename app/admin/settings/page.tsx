import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { AccountSettings } from "@/components/account-settings";
import { ActiveSessions } from "@/components/active-sessions";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const recentAudit = await db.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <PageHeader title="System settings" subtitle="Your admin account and the audit trail." />
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="space-y-6">
          <AccountSettings name={user.name} phone={user.phone} email={user.email} />
          <ActiveSessions />
        </div>
        <Card>
          <CardBody>
            <h2 className="font-bold text-lg text-stone-800 mb-3">Recent audit log</h2>
            {recentAudit.length === 0 ? (
              <p className="text-stone-500 text-sm">No entries yet.</p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {recentAudit.map((entry) => (
                  <li key={entry.id} className="border-b border-stone-100 last:border-0 pb-2 last:pb-0">
                    <p className="font-semibold text-stone-700">
                      {entry.action} <span className="text-stone-400 font-normal">· {entry.entity}</span>
                    </p>
                    <p className="text-stone-500">
                      {entry.actor?.name ?? "System"} · {formatDateTime(entry.createdAt)}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
