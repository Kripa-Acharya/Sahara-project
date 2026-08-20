import Link from "next/link";
import type { User } from "@prisma/client";
import { listThreadsForUser } from "@/lib/messages";
import { formatDateTime } from "@/lib/format";
import { Badge, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { SupportThreadButton } from "./support-thread-button";

/** Shared messages inbox for all roles. */
export async function ThreadsPage({ user, basePath }: { user: User; basePath: string }) {
  const threads = await listThreadsForUser(user);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Messages"
        subtitle="Booking conversations and साहारा support."
        action={user.role !== "ADMIN" ? <SupportThreadButton basePath={basePath} /> : undefined}
      />

      {threads.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          body="Each booking gets its own conversation. You can also message साहारा support directly."
        />
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => {
            const last = thread.messages[0];
            return (
              <Link key={thread.id} href={`${basePath}/messages/${thread.id}`} className="block">
                <Card className={thread.unreadCount > 0 ? "border-primary-300" : undefined}>
                  <CardBody className="py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-stone-800 truncate">
                        {thread.subject}
                        {thread.booking && (
                          <span className="text-stone-400 font-normal">
                            {" "}· {thread.booking.elder.fullName}
                          </span>
                        )}
                      </p>
                      {thread.unreadCount > 0 && (
                        <Badge tone="bg-primary-600 text-white">{thread.unreadCount} new</Badge>
                      )}
                    </div>
                    {last ? (
                      <p className="text-sm text-stone-500 truncate mt-1">
                        {last.sender.name.split(" ")[0]}: {last.body}
                      </p>
                    ) : (
                      <p className="text-sm text-stone-400 mt-1">No messages yet.</p>
                    )}
                    <p className="text-xs text-stone-400 mt-1">{formatDateTime(thread.updatedAt)}</p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
