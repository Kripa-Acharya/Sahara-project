import { requireUser } from "@/lib/auth";
import { ThreadsPage } from "@/components/messages/threads-page";

export default async function AdminMessagesPage() {
  const user = await requireUser("ADMIN");
  return <ThreadsPage user={user} basePath="/admin" />;
}
