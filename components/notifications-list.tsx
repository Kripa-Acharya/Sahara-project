import Link from "next/link";
import type { Notification } from "@prisma/client";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { formatDateTime } from "@/lib/format";
import { Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const typeIcons: Record<Notification["type"], string> = {
  BOOKING: "🗒️",
  VISIT: "🤝",
  PAYMENT: "💳",
  MESSAGE: "💬",
  EMERGENCY: "🆘",
  SYSTEM: "ℹ️",
};

/** Shared notifications page body for all roles. */
export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notifications"
        action={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <SubmitButton variant="outline" size="sm" pendingText="Marking…">
                Mark all as read
              </SubmitButton>
            </form>
          ) : undefined
        }
      />
      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Nothing here yet" body="Updates about bookings, visits, and safety will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const body = (
              <Card
                className={
                  notification.isRead ? "opacity-70" : "border-primary-200 bg-primary-50/40"
                }
              >
                <CardBody className="py-4 flex gap-3 items-start">
                  <span aria-hidden className="text-xl">{typeIcons[notification.type]}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800">{notification.title}</p>
                    {notification.body && (
                      <p className="text-sm text-stone-600">{notification.body}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-1">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                </CardBody>
              </Card>
            );
            return notification.linkUrl ? (
              <Link key={notification.id} href={notification.linkUrl} className="block">
                {body}
              </Link>
            ) : (
              <div key={notification.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
