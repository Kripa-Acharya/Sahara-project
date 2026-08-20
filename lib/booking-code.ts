import { db } from "@/lib/db";

/** Generate the next human-friendly booking code, e.g. SB-2026-0004. */
export async function nextBookingCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SB-${year}-`;
  const last = await db.booking.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const lastNum = last ? parseInt(last.code.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}
