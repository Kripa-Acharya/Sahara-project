import { db } from "@/lib/db";

/** Record an important administrative or safety-relevant action. */
export async function logAudit(
  actorId: string | null,
  action: string,
  entity: string,
  detail?: string,
): Promise<void> {
  await db.auditLog.create({ data: { actorId, action, entity, detail } });
}
