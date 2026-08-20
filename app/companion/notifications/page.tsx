import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsList } from "@/components/notifications-list";

export default async function CompanionNotificationsPage() {
  const user = await requireUser("COMPANION");
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return <NotificationsList notifications={notifications} />;
}
