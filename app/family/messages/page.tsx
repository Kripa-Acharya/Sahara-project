import { requireUser } from "@/lib/auth";
import { ThreadsPage } from "@/components/messages/threads-page";

export default async function FamilyMessagesPage() {
  const user = await requireUser("FAMILY");
  return <ThreadsPage user={user} basePath="/family" />;
}
