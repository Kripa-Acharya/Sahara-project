import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { uploadVerificationDocument } from "@/lib/actions/files";
import { validateUpload, MAX_UPLOAD_BYTES } from "@/lib/files/validate";
import { GET as downloadFile } from "@/app/api/files/[id]/route";
import { resetRateLimits } from "@/lib/rate-limit";
import { __clearCookies } from "next/headers";
import { createAndLogin } from "./helpers";

beforeEach(() => {
  resetRateLimits();
  __clearCookies();
});

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("test-image-data"),
]);
const PDF_BYTES = Buffer.from("%PDF-1.4\nsahara test document");

function uploadForm(slot: string, name: string, type: string, bytes: Buffer): FormData {
  const fd = new FormData();
  fd.set("slot", slot);
  fd.set("file", new File([new Uint8Array(bytes)], name, { type }));
  return fd;
}

describe("upload validation", () => {
  it("rejects spoofed file types (exe bytes with pdf name+mime)", () => {
    const exe = Buffer.from("MZ\x90\x00executable");
    const result = validateUpload("passport.pdf", "application/pdf", exe, ["pdf", "jpeg", "png"]);
    expect(result.ok).toBe(false);
  });

  it("rejects mismatched extension and content", () => {
    const result = validateUpload("photo.png", "image/png", PDF_BYTES, ["pdf", "jpeg", "png"]);
    expect(result.ok).toBe(false);
  });

  it("rejects oversized files", () => {
    const big = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 1);
    big.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = validateUpload("big.png", "image/png", big, ["png"]);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/5 MB/);
  });

  it("accepts a genuine png and pdf", () => {
    expect(validateUpload("id.png", "image/png", PNG_BYTES, ["png"]).ok).toBe(true);
    expect(validateUpload("report.pdf", "application/pdf", PDF_BYTES, ["pdf"]).ok).toBe(true);
  });
});

describe("verification document upload", () => {
  it("stores, links and audits a valid document", async () => {
    const companion = await createAndLogin("COMPANION", "Uploader");
    const result = await uploadVerificationDocument(
      undefined,
      uploadForm("citizenship", "citizenship.png", "image/png", PNG_BYTES),
    );
    expect(result?.error).toBeUndefined();
    expect(result?.ok).toBe(true);

    const profile = await db.companionProfile.findUnique({
      where: { id: companion.companionProfile!.id },
      include: { citizenshipFile: true, verification: true },
    });
    expect(profile!.citizenshipFile).not.toBeNull();
    expect(profile!.citizenshipFile!.status).toBe("AVAILABLE");
    expect(profile!.citizenshipFile!.mimeType).toBe("image/png");
    expect(profile!.verification!.idSubmitted).toBe(true);
    expect(profile!.verification!.status).toBe("UNDER_REVIEW");

    const audit = await db.auditLog.findFirst({
      where: { actorId: companion.id, action: "file.uploaded" },
    });
    expect(audit).not.toBeNull();
  });

  it("rejects a spoofed upload end-to-end", async () => {
    await createAndLogin("COMPANION", "Spoofer");
    const result = await uploadVerificationDocument(
      undefined,
      uploadForm("citizenship", "malware.pdf", "application/pdf", Buffer.from("MZ\x90\x00nope")),
    );
    expect(result?.error).toMatch(/isn't supported/i);
  });
});

describe("authorized download route", () => {
  async function uploadedFileId(): Promise<{ ownerId: string; fileId: string }> {
    const owner = await createAndLogin("COMPANION", "Doc Owner");
    await uploadVerificationDocument(
      undefined,
      uploadForm("policeReport", "police.pdf", "application/pdf", PDF_BYTES),
    );
    const profile = await db.companionProfile.findUnique({
      where: { id: owner.companionProfile!.id },
    });
    return { ownerId: owner.id, fileId: profile!.policeReportFileId! };
  }

  function request(fileId: string) {
    return downloadFile(new Request(`http://localhost/api/files/${fileId}`), {
      params: Promise.resolve({ id: fileId }),
    });
  }

  it("serves the file to its owner and logs access", async () => {
    const { ownerId, fileId } = await uploadedFileId();
    const response = await request(fileId);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const body = Buffer.from(await response.arrayBuffer());
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");

    const audit = await db.auditLog.findFirst({
      where: { actorId: ownerId, action: "file.accessed", entity: `StoredFile:${fileId}` },
    });
    expect(audit).not.toBeNull();
  });

  it("returns 404 (not 403) to other users and 401 anonymously", async () => {
    const { fileId } = await uploadedFileId();

    __clearCookies();
    await createAndLogin("COMPANION", "Snooper");
    expect((await request(fileId)).status).toBe(404);

    __clearCookies();
    await createAndLogin("FAMILY", "Curious Family");
    expect((await request(fileId)).status).toBe(404);

    __clearCookies();
    expect((await request(fileId)).status).toBe(401);

    __clearCookies();
    await createAndLogin("ADMIN");
    expect((await request(fileId)).status).toBe(200);
  });
});
