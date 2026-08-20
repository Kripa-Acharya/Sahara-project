/**
 * Upload validation: extension AND declared MIME type AND magic bytes must
 * all agree, and the file must be within the size limit. A spoofed extension
 * or content-type fails the signature check.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

type Signature = { ext: string[]; mime: string[]; matches: (bytes: Buffer) => boolean };

const SIGNATURES: Record<string, Signature> = {
  pdf: {
    ext: ["pdf"],
    mime: ["application/pdf"],
    matches: (b) => b.length > 4 && b.subarray(0, 4).toString("latin1") === "%PDF",
  },
  jpeg: {
    ext: ["jpg", "jpeg"],
    mime: ["image/jpeg"],
    matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  png: {
    ext: ["png"],
    mime: ["image/png"],
    matches: (b) =>
      b.length > 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  webp: {
    ext: ["webp"],
    mime: ["image/webp"],
    matches: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
};

export type UploadValidation =
  | { ok: true; detectedMime: string }
  | { ok: false; error: string };

export function validateUpload(
  originalName: string,
  declaredMime: string,
  bytes: Buffer,
  allowed: ("pdf" | "jpeg" | "png" | "webp")[],
): UploadValidation {
  if (bytes.length === 0) return { ok: false, error: "The file is empty." };
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "The file is larger than 5 MB. Please upload a smaller file." };
  }

  const ext = originalName.toLowerCase().split(".").pop() ?? "";
  for (const kind of allowed) {
    const sig = SIGNATURES[kind]!;
    if (sig.ext.includes(ext) && sig.mime.includes(declaredMime.toLowerCase()) && sig.matches(bytes)) {
      return { ok: true, detectedMime: sig.mime[0]! };
    }
  }
  return {
    ok: false,
    error: "This file type isn't supported. Please upload a PDF, JPG, or PNG document.",
  };
}

/** A safe display name: keeps a readable stem, strips anything path-like. */
export function sanitizeOriginalName(name: string): string {
  return name.replace(/[\\/]/g, "_").replace(/[^\w .()-]/g, "_").slice(0, 120) || "document";
}
