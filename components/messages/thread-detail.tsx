import { notFound } from "next/navigation";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { canAccessThread, markThreadRead } from "@/lib/actions/messages";
import { Conversation } from "./conversation";

/** Shared thread page body: access check, mark-as-read, render. */
export async function ThreadDetail({
  threadId,
  user,
  basePath,
}: {
  threadId: string;
  user: User;
  basePath: string;
}) {
  const thread = await db.messageThread.findUnique({ where: { id: threadId } });
  if (!thread || !(await canAccessThread(user, thread))) notFound();

  await markThreadRead(thread.id);

  const messages = await db.message.findMany({
    where: { threadId: thread.id },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Conversation
      thread={thread}
      messages={messages}
      currentUserId={user.id}
      backHref={`${basePath}/messages`}
    />
  );
}
