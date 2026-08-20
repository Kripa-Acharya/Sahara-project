import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

/** Create an in-app notification for a user. */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  linkUrl?: string,
): Promise<void> {
  await db.notification.create({ data: { userId, type, title, body, linkUrl } });
}

/** Notify every active administrator. */
export async function notifyAdmins(
  type: NotificationType,
  title: string,
  body?: string,
  linkUrl?: string,
): Promise<void> {
  const admins = await db.user.findMany({ where: { role: "ADMIN", isActive: true } });
  await db.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, type, title, body, linkUrl })),
  });
}
