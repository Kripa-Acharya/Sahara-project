import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AccountSettings } from "@/components/account-settings";
import { ActiveSessions } from "@/components/active-sessions";

export default async function FamilySettingsPage() {
  const user = await requireUser("FAMILY");
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your account details and security." />
      <div className="space-y-6 max-w-xl">
        <AccountSettings name={user.name} phone={user.phone} email={user.email} />
        <ActiveSessions />
      </div>
    </div>
  );
}
