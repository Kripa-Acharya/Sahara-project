import { requireUser } from "@/lib/auth";
import { ThreadsPage } from "@/components/messages/threads-page";

export default async function CompanionMessagesPage() {
  const user = await requireUser("COMPANION");
  return <ThreadsPage user={user} basePath="/companion" />;
}
