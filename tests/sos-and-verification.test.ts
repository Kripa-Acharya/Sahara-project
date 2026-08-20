import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { raiseElderSos } from "@/lib/actions/sos";
import { resolveAlert, updateVerification } from "@/lib/actions/admin";
import { createAndLogin, createElderFor, formData, loginAs } from "./helpers";

describe("SOS workflow", () => {
  it("elder SOS creates an alert and notifies family + admins; admin resolves it", async () => {
    const admin = await createAndLogin("ADMIN", "SOS Admin");
    const family = await createAndLogin("FAMILY", "SOS Family");
    const elder = await createElderFor(family.familyProfile!.id, "SOS Elder");

    // Elder screen SOS — no login required, identified by access code.
    const sosResult = await raiseElderSos(undefined, formData({ accessCode: elder.elderAccessCode! }));
    expect(sosResult?.error).toBeUndefined();

    const alert = await db.emergencyAlert.findFirst({ where: { elderId: elder.id } });
    expect(alert).not.toBeNull();
    expect(alert!.status).toBe("ACTIVE");
    expect(alert!.raisedBy).toBe("elder");

    // Family got an emergency notification.
    const familyNotification = await db.notification.findFirst({
      where: { userId: family.id, type: "EMERGENCY" },
    });
    expect(familyNotification).not.toBeNull();

    // Admin got one too.
    const adminNotification = await db.notification.findFirst({
      where: { userId: admin.id, type: "EMERGENCY" },
    });
    expect(adminNotification).not.toBeNull();

    // Admin resolves with a required note.
    await loginAs(admin.id, "ADMIN");
    const noNote = await resolveAlert(undefined, formData({ alertId: alert!.id, resolvedNote: "" }));
    expect(noNote?.error).toMatch(/describe/i);

    const resolved = await resolveAlert(undefined, formData({
      alertId: alert!.id,
      resolvedNote: "Neighbour checked in; all well.",
    }));
    expect(resolved?.error).toBeUndefined();
    expect((await db.emergencyAlert.findUnique({ where: { id: alert!.id } }))!.status).toBe("RESOLVED");
  });

  it("rejects an unknown elder access code", async () => {
    const result = await raiseElderSos(undefined, formData({ accessCode: "NOPE123" }));
    expect(result?.error).toBe("not-found");
  });
});

describe("companion verification", () => {
  it("admin cannot verify without final approval, then approves fully", async () => {
    const companionUser = await createAndLogin("COMPANION", "Verify Me");
    const admin = await createAndLogin("ADMIN");
    const companionId = companionUser.companionProfile!.id;

    // VERIFIED without finalApproval checkbox → rejected.
    const bad = await updateVerification(undefined, formData({
      companionId,
      status: "VERIFIED",
      idSubmitted: "on",
    }));
    expect(bad?.error).toMatch(/final approval/i);

    // Full approval.
    const good = await updateVerification(undefined, formData({
      companionId,
      status: "VERIFIED",
      idSubmitted: "on",
      policeReportSubmitted: "on",
      referencesChecked: "on",
      phoneVerified: "on",
      addressVerified: "on",
      interviewCompleted: "on",
      orientationCompleted: "on",
      skillsReviewed: "on",
      emergencyTrainingDone: "on",
      finalApproval: "on",
      adminNotes: "All checks passed.",
    }));
    expect(good?.error).toBeUndefined();

    const verification = await db.companionVerification.findUnique({
      where: { companionId },
    });
    expect(verification!.status).toBe("VERIFIED");
    expect(verification!.finalApproval).toBe(true);

    // The companion was notified of the status change.
    const notification = await db.notification.findFirst({
      where: { userId: companionUser.id, title: "Verification update" },
    });
    expect(notification).not.toBeNull();
    expect(admin.role).toBe("ADMIN");
  });
});
