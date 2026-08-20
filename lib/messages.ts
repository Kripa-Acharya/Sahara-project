import { db } from "@/lib/db";
import type { User } from "@prisma/client";

/** Threads visible to a user, with last message and unread count. */
export async function listThreadsForUser(user: User) {
  const where =
    user.role === "ADMIN"
      ? {}
      : user.role === "FAMILY"
        ? {
            OR: [
              { supportUserId: user.id },
              { booking: { family: { userId: user.id } } },
            ],
          }
        : {
            OR: [
              { supportUserId: user.id },
              { booking: { assignment: { companion: { userId: user.id } } } },
            ],
          };

  const threads = await db.messageThread.findMany({
    where,
    include: {
      booking: { include: { elder: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Unread = messages not sent by me whose readBy doesn't include me.
  const counts = await Promise.all(
    threads.map((thread) =>
      db.message
        .findMany({
          where: { threadId: thread.id, NOT: { senderId: user.id } },
          select: { readBy: true },
        })
        .then(
          (messages) =>
            messages.filter(
              (m) => !(m.readBy ?? "").split(",").filter(Boolean).includes(user.id),
            ).length,
        ),
    ),
  );

  return threads.map((thread, i) => ({ ...thread, unreadCount: counts[i]! }));
}
