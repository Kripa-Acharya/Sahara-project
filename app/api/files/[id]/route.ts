import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canViewSensitiveDocument } from "@/lib/policies";
import { getFileStorageProvider } from "@/lib/files/storage";
import { logAudit } from "@/lib/audit";

/**
 * Authorized file download. Files are private by default: this route is the
 * only way bytes leave storage, every request re-checks authorization, and
 * access to verification documents is audit-logged.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = await db.storedFile.findUnique({ where: { id } });
  // Same 404 for "missing" and "forbidden": no resource-existence oracle.
  if (!file || !(await canViewSensitiveDocument(user, file))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await getFileStorageProvider().get(file.storageKey);
  if (!bytes) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (file.kind === "VERIFICATION_DOCUMENT") {
    await logAudit(user.id, "file.accessed", `StoredFile:${file.id}`, file.originalName);
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `attachment; filename="${file.originalName.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
