import { requireUser } from "@/lib/auth";
import { ThreadDetail } from "@/components/messages/thread-detail";

export default async function FamilyThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const user = await requireUser("FAMILY");
  const { threadId } = await params;
  return <ThreadDetail threadId={threadId} user={user} basePath="/family" />;
}
