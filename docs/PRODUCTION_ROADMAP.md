# साहारा — Production Roadmap (backlog for Phases 5–10, 13–14)

Completed in the current pass: Phase 0 (audit), 1 (PostgreSQL), 2 (auth
security), 3 (authorization), 4 (secure files), 11 (headers/request
protection), 12 (observability foundations), plus test and CI expansion.

Everything below is **not implemented**. Where a model or interface already
exists to support completed work, it is noted. No fake external integrations
were created, and no half-finished workflow is enabled in the UI.

---

## Phase 5 — Notification architecture

**Exists today:** in-app `Notification` model, `lib/notify.ts`, `MailProvider`
seam with a development mailbox adapter, `PhoneVerificationProvider` interface.

**Backlog**
- `NotificationTemplate` (key, channel, locale `en`/`ne`, subject, body) preserving the current warm microcopy.
- `NotificationDelivery` (channel, recipient, provider, providerMessageId, attemptCount, sentAt, deliveredAt, failedAt, errorClass, status incl. `DEAD_LETTER`).
- Channel providers: email (Resend/SES), SMS (Sparrow SMS or similar for Nepal), web push, voice escalation interface.
- Retry with exponential backoff and a permanent-failure state; a worker or scheduled job to drain the queue.
- `NotificationPreference` per user/channel/type + quiet hours; **emergency bypasses quiet hours**.
- Idempotency key per (event, recipient, channel) so retried Server Actions never double-send.
- Tests: failed delivery, retry/backoff, idempotency, quiet-hours bypass.

**Ordering note:** do this before Phase 6 — SOS escalation depends on delivery records.

## Phase 6 — Production-grade SOS workflow

**Exists today:** `EmergencyAlert` with ACTIVE/ACKNOWLEDGED/RESOLVED, admin queue,
one-tap call links, mandatory resolution note, `logger.critical` hook on raise,
per-IP raise throttling.

**Backlog**
- Full lifecycle: `RAISED → DISPATCHING → ACKNOWLEDGED → ESCALATED → IN_PROGRESS → RESOLVED | CANCELLED_ACCIDENTAL → CLOSED_AFTER_REVIEW`.
- Immutable `SosEvent` timeline (append-only) recording every state change **and every notification attempt**.
- Single acknowledgement owner (`acknowledgedByUserId` claimed atomically); simultaneous acknowledgement resolves to one winner.
- Configurable escalation timers with alternate emergency-contact escalation when nobody acknowledges.
- Distinguish: created locally → received by server → notifications dispatched → human acknowledgement.
- Accidental-cancellation window; `isDrill` flag separating test/drill alerts from real ones.
- Optional location snapshot **with explicit consent**, labelled current / recently recorded / unavailable. No fake live tracking.
- Keep the existing "साहारा does not replace police, ambulance or hospital services" disclaimers.
- Tests: simultaneous acknowledgement, duplicate SOS, notification failure, escalation timeout, accidental cancellation, resolution audit trail.

## Phase 7 — Scheduling and booking integrity

**Exists today:** idempotent creation, server-side pricing, overlap detection on
assignment, cancellation reasons, status-guarded assignment responses.

**Backlog**
- Recurring bookings; reschedule workflow; configurable cancellation policy windows.
- Immutable price snapshot per booking (line items frozen at submission) and a clear estimated/confirmed/paid/refunded distinction.
- Companion travel buffer, travel radius, configurable service areas.
- Late-arrival, family-notified, no-show and replacement-companion workflows; assignment-pending state.
- Minimum booking notice, operating hours, after-hours rates.
- Per-viewer timezone display (family abroad) alongside NPT scheduling.
- Tests: overlapping/repeated/cancelled/rescheduled bookings, DST-adjacent cases.

## Phase 8 — Payment readiness

**Exists today:** `PaymentProvider` interface + demo adapter, one `Payment` per
booking, admin status override with reason + audit.

**Backlog**
- `PaymentIntent`/attempt records with provider transaction IDs and idempotency keys.
- `WebhookEvent` storage, signature-verification interface, replay protection, out-of-order handling.
- Full state set: created, pending, authorized, captured, failed, cancelled, partially refunded, refunded; `Refund` records.
- Cash reconciliation, remittance references, invoice/receipt records.
- Companion earnings ledger and payout ledger; platform fees, discounts, adjustments (adjustments require reason + audit).
- Reconciliation report for finance admins.
- Tests: duplicate webhooks, out-of-order events, partial refunds.
- **Never** store raw card details; keep demo adapters until real credentials exist.

## Phase 9 — Privacy and consent

**Exists today:** elder-care consent flag captured at profile creation, minimal
health notes, audit logging on sensitive document access.

**Backlog**
- Versioned terms and privacy-notice acceptance records; consent withdrawal.
- Separate consent records: elder care, photo, location, communication channel.
- Companion confidentiality acknowledgement.
- Data-export and account-deletion requests; retention configuration; soft deletion and anonymization where deletion isn't possible.
- Field-level visibility matrix per role for health/medication notes, with access audit.
- Plain-language Nepali and English consent explanations.

## Phase 10 — PWA and unreliable-network support

**Backlog**
- Manifest, icons, service worker, offline fallback, connectivity indicator.
- Cached read-only "next visit"; offline draft + retry queue for companion visit reports with an explicit "not yet sent" state.
- Web push subscription model; permission requested only after explaining the benefit; app badge; update prompt.
- Cache rules that never leak one user's data to another and never present stale SOS status as live.

## Phase 13 — Accessibility and elder usability

**Exists today:** focus rings, semantic labels, reduced-motion support, ≥48 px
elder targets, bilingual elder screen with replayable voice prompts, SOS confirm step.

**Backlog**
- Automated axe checks in CI plus a documented manual keyboard/screen-reader pass.
- Large-text and high-contrast modes for `/elder`.
- Audit that no status is communicated by colour alone; add text/icon pairs where missing.
- Double-tap protection on destructive/emergency actions; non-animation-dependent loading and success feedback.
- Nepali pronunciation review for voice prompts.

## Phase 14 — Test expansion

**Exists today:** 41 tests on PostgreSQL covering auth security, authorization/IDOR,
booking lifecycle and integrity, SOS raise/resolve, verification rules, file
security, seed safety; CI runs format/lint/typecheck/tests/build/migration checks.

**Backlog**
- End-to-end browser tests (Playwright) for the core journeys.
- Concurrency tests under real parallel load (booking, SOS acknowledgement).
- Notification retry and payment webhook tests (arrive with Phases 5 and 8).
- Accessibility smoke tests; timezone tests; offline/PWA tests; migration-drift check.

---

## Recommended next phase

**Phase 5 (notifications), then Phase 6 (SOS escalation)** — in that order.
Emergency alerts currently reach people only inside the app; making SOS
dependable off-app is the highest-value remaining safety work, and the SOS
escalation state machine needs delivery records to be meaningful.
