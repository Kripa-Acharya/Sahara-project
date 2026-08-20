"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCompanion } from "@/lib/auth";
import { getFileScanner, getFileStorageProvider } from "@/lib/files/storage";
import { sanitizeOriginalName, validateUpload } from "@/lib/files/validate";
import { logAudit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify";
import type { FormState } from "@/lib/actions/auth";

const DOC_SLOTS = {
  citizenship: {
    label: "Citizenship / ID document",
    profileField: "citizenshipFileId" as const,
    checklistField: "idSubmitted" as const,
  },
  policeReport: {
    label: "Police report",
    profileField: "policeReportFileId" as const,
    checklistField: "policeReportSubmitted" as const,
  },
};

/**
 * Companion uploads a verification document (real bytes, validated by
 * extension + MIME + magic bytes + size, stored privately, scanned, and
 * linked to the profile). Replaces the previous file-name simulation.
 */
export async function uploadVerificationDocument(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, profile } = await requireCompanion();

  const slotKey = String(formData.get("slot") ?? "") as keyof typeof DOC_SLOTS;
  const slot = DOC_SLOTS[slotKey];
  if (!slot) return { error: "Unknown document type." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const validation = validateUpload(file.name, file.type, bytes, ["pdf", "jpeg", "png"]);
  if (!validation.ok) return { error: validation.error };

  // Store privately, then scan. Dev scanner returns clean immediately;
  // a dirty verdict quarantines the file and never links it.
  const storage = getFileStorageProvider();
  const { storageKey } = await storage.put(bytes, { kindPrefix: "verification" });

  const stored = await db.storedFile.create({
    data: {
      kind: "VERIFICATION_DOCUMENT",
      status: "SCANNING",
      ownerUserId: user.id,
      storageKey,
      originalName: sanitizeOriginalName(file.name),
      mimeType: validation.detectedMime,
      sizeBytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      provider: storage.key,
    },
  });

  const scan = await getFileScanner().scan(bytes);
  if (scan.verdict !== "clean") {
    await db.storedFile.update({
      where: { id: stored.id },
      data: { status: "QUARANTINED", scanResult: scan.detail ?? scan.verdict },
    });
    await logAudit(user.id, "file.quarantined", `StoredFile:${stored.id}`);
    return { error: "This file failed our safety scan and was not accepted." };
  }

  // Replace any previous document in this slot (old file soft-deleted).
  const previousFileId = profile[slot.profileField];
  await db.$transaction(async (tx) => {
    await tx.storedFile.update({
      where: { id: stored.id },
      data: { status: "AVAILABLE", scanResult: scan.detail ?? "clean" },
    });
    await tx.companionProfile.update({
      where: { id: profile.id },
      data: { [slot.profileField]: stored.id },
    });
    if (previousFileId) {
      await tx.storedFile.update({
        where: { id: previousFileId },
        data: { status: "DELETED", deletedAt: new Date() },
      });
    }
    const verification = await tx.companionVerification.findUnique({
      where: { companionId: profile.id },
    });
    if (verification) {
      await tx.companionVerification.update({
        where: { id: verification.id },
        data: {
          [slot.checklistField]: true,
          status: verification.status === "INCOMPLETE" ? "UNDER_REVIEW" : verification.status,
        },
      });
    }
  });

  await logAudit(user.id, "file.uploaded", `StoredFile:${stored.id}`, slot.label);
  await notifyAdmins(
    "SYSTEM",
    `Verification document uploaded — ${user.name}`,
    `${slot.label} is ready for review.`,
    "/admin/companions",
  );

  revalidatePath("/companion/profile");
  revalidatePath("/companion/verification");
  return { ok: true };
}
