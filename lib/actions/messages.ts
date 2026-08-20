"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canMessageInThread } from "@/lib/policies";
import { notify, notifyAdmins } from "@/lib/notify";
import type { FormState } from "@/lib/actions/auth";
import type { MessageThread, User } from "@prisma/client";

/** Thread access — delegated to the central policy layer (lib/policies.ts). */
export async function canAccessThread(user: User, thread: MessageThread): Promise<boolean> {
  return canMessageInThread(user, thread);
}

const messageSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1, "Please write a message.").max(4000),
  attachmentName: z.string().trim().optional(),
});

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = messageSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
    attachmentName: formData.get("attachmentName") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const thread = await db.messageThread.findUnique({ where: { id: parsed.data.threadId } });
  if (!thread || !(await canAccessThread(user, thread))) {
    return { error: "Conversation not found." };
  }

  if (
    parsed.data.attachmentName &&
    !/^[\w .-]+\.(jpg|jpeg|png|webp|pdf)$/i.test(parsed.data.attachmentName)
  ) {
    return { error: "Attachment must be an image or PDF file name (demo placeholder)." };
  }

  await db.message.create({
    data: {
      threadId: thread.id,
      senderId: user.id,
      body: parsed.data.body,
      attachmentName: parsed.data.attachmentName || null,
      readBy: user.id,
    },
  });
  await db.messageThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

  // Notify the other side (booking threads: family + companion; support: admins or the owner).
  if (thread.bookingId) {
    const booking = await db.booking.findUnique({
      where: { id: thread.bookingId },
      include: {
        family: { include: { user: true } },
        assignment: { include: { companion: { include: { user: true } } } },
      },
    });
    const recipients = [
      booking?.family?.user,
      booking?.assignment?.companion.user,
    ].filter((u): u is User => Boolean(u && u.id !== user.id));
    for (const recipient of recipients) {
      const base = recipient.role === "FAMILY" ? "/family" : "/companion";
      await notify(
        recipient.id,
        "MESSAGE",
        `New message — ${booking?.code}`,
        parsed.data.body.slice(0, 80),
        `${base}/messages/${thread.id}`,
      );
    }
  } else if (thread.supportUserId && user.role === "ADMIN") {
    const owner = await db.user.findUnique({ where: { id: thread.supportUserId } });
    if (owner) {
      const base = owner.role === "FAMILY" ? "/family" : "/companion";
      await notify(owner.id, "MESSAGE", "New message from साहारा support", parsed.data.body.slice(0, 80), `${base}/messages/${thread.id}`);
    }
  } else if (thread.supportUserId) {
    await notifyAdmins("MESSAGE", `Support message from ${user.name}`, parsed.data.body.slice(0, 80), `/admin/messages/${thread.id}`);
  }

  revalidatePath(`/family/messages/${thread.id}`);
  revalidatePath(`/companion/messages/${thread.id}`);
  revalidatePath(`/admin/messages/${thread.id}`);
  return {};
}

/** Mark every message in a thread as read by the current user. */
export async function markThreadRead(threadId: string): Promise<void> {
  const user = await requireUser();
  const thread = await db.messageThread.findUnique({ where: { id: threadId } });
  if (!thread || !(await canAccessThread(user, thread))) return;

  const messages = await db.message.findMany({
    where: { threadId, NOT: { senderId: user.id } },
  });
  for (const message of messages) {
    const readers = (message.readBy ?? "").split(",").filter(Boolean);
    if (!readers.includes(user.id)) {
      await db.message.update({
        where: { id: message.id },
        data: { readBy: [...readers, user.id].join(",") },
      });
    }
  }
}

/** Get (or create) the current user's direct support thread with साहारा. */
export async function ensureSupportThread(): Promise<string> {
  const user = await requireUser("FAMILY", "COMPANION");
  const existing = await db.messageThread.findUnique({ where: { supportUserId: user.id } });
  if (existing) return existing.id;
  const created = await db.messageThread.create({
    data: { supportUserId: user.id, subject: `साहारा support — ${user.name}` },
  });
  return created.id;
}
