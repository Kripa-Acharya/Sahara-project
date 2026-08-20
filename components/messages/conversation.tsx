import type { Message, MessageThread, User } from "@prisma/client";
import { formatDateTime } from "@/lib/format";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { Composer } from "./composer";
import { AutoRefresh } from "./auto-refresh";

type MessageWithSender = Message & { sender: User };

/** Shared conversation view for all roles. */
export function Conversation({
  thread,
  messages,
  currentUserId,
  backHref,
}: {
  thread: MessageThread;
  messages: MessageWithSender[];
  currentUserId: string;
  backHref: string;
}) {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title={thread.subject}
        action={
          <a href={backHref} className="text-primary-700 font-semibold hover:underline">
            ← All messages
          </a>
        }
      />
      <AutoRefresh seconds={15} />

      <Card>
        <CardBody>
          {messages.length === 0 ? (
            <p className="text-stone-500 text-center py-6">
              No messages yet — say namaste! 🙏
            </p>
          ) : (
            <ol className="space-y-4" aria-label="Messages">
              {messages.map((message) => {
                const mine = message.senderId === currentUserId;
                return (
                  <li key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        mine
                          ? "bg-primary-600 text-white rounded-br-md"
                          : "bg-stone-100 text-stone-800 rounded-bl-md",
                      ].join(" ")}
                    >
                      {!mine && (
                        <p className="text-xs font-bold mb-0.5 opacity-80">
                          {message.sender.name}
                          {message.sender.role === "ADMIN" ? " · साहारा support" : ""}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      {message.attachmentName && (
                        <p className={`text-xs mt-1 ${mine ? "text-primary-100" : "text-stone-500"}`}>
                          📎 {message.attachmentName} (demo attachment)
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${mine ? "text-primary-200" : "text-stone-400"}`}>
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-5 border-t border-stone-100 pt-4">
            <Composer threadId={thread.id} />
          </div>
        </CardBody>
      </Card>
      <p className="mt-3 text-xs text-stone-400 text-center">
        Messages refresh automatically every few seconds.
      </p>
    </div>
  );
}
