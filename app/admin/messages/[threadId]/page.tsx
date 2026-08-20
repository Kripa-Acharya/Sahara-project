import { requireUser } from "@/lib/auth";
import { ThreadDetail } from "@/components/messages/thread-detail";

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await requireUser("ADMIN");
  const { threadId } = await params;
  return <ThreadDetail threadId={threadId} user={user} basePath="/admin" />;
}
