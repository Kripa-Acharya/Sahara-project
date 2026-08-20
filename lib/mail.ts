import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Outbound mail provider seam.
 *
 * Production wires a real provider (Resend, SES, …) behind `MailProvider`.
 * Development uses `devMailboxProvider`, which writes each message to
 * `storage/dev-mailbox/` (gitignored, never under /public). Tokens inside the
 * message body are therefore never written to application logs.
 */
export interface MailProvider {
  key: string;
  send(message: { to: string; subject: string; text: string }): Promise<{ ok: boolean }>;
}

const DEV_MAILBOX_DIR = join(process.cwd(), "storage", "dev-mailbox");

export const devMailboxProvider: MailProvider = {
  key: "dev-mailbox",
  async send({ to, subject, text }) {
    mkdirSync(DEV_MAILBOX_DIR, { recursive: true });
    const file = join(
      DEV_MAILBOX_DIR,
      `${Date.now()}-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.txt`,
    );
    writeFileSync(file, `To: ${to}\nSubject: ${subject}\n\n${text}\n`, "utf8");
    // Log only the location — never the content (it may contain tokens).
    console.log(`[mail:dev] "${subject}" written to storage/dev-mailbox/`);
    return { ok: true };
  },
};

export function getMailProvider(): MailProvider {
  // Future: switch on MAIL_PROVIDER env (resend/ses/...) with credentials.
  return devMailboxProvider;
}

/**
 * Phone-verification provider seam (Phase 2 interface; UI flow is on the
 * production roadmap). Development adapter writes the code to the dev mailbox.
 */
export interface PhoneVerificationProvider {
  key: string;
  sendCode(phone: string, code: string): Promise<{ ok: boolean }>;
}

export const devPhoneProvider: PhoneVerificationProvider = {
  key: "dev-mailbox",
  async sendCode(phone, code) {
    mkdirSync(DEV_MAILBOX_DIR, { recursive: true });
    const file = join(DEV_MAILBOX_DIR, `${Date.now()}-sms-verification.txt`);
    writeFileSync(file, `To (SMS): ${phone}\n\nYour साहारा verification code is ${code}\n`, "utf8");
    console.log("[sms:dev] verification code written to storage/dev-mailbox/");
    return { ok: true };
  },
};

export function getPhoneVerificationProvider(): PhoneVerificationProvider {
  return devPhoneProvider;
}
