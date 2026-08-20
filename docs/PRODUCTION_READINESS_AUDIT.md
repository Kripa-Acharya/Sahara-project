# साहारा — Production Readiness Audit (Phase 0)

Date: 2026-07-31 · Auditor: development pass on branch `main` (uncommitted work)

Baseline verified before changes: `npm run lint` ✅ · `npm run typecheck` ✅ ·
`npm test` ✅ (14/14, SQLite scratch DB) · `npm run build` ✅ (verified this session).

---

## 1. Architecture map (as audited)

| Concern | Implementation |
| --- | --- |
| Authentication | Custom credential auth. scrypt password hashes (`lib/password.ts`). **Stateless** HMAC-SHA256-signed cookie (`lib/session.ts`) containing `{userId, role, exp}`; 7-day expiry; httpOnly, SameSite=Lax, Secure in prod. |
| Authorization | Per-request role gates: `requireUser/requireFamily/requireCompanion/requireAdmin` (`lib/auth.ts`) called in every layout, page, and server action. Ownership scoping done inline in each action/page via Prisma `where` filters (e.g. `familyId: profile.id`). |
| Data access | Prisma 6 + SQLite (`lib/db.ts` singleton). 22 models. Server components query directly; mutations only via Server Actions in `lib/actions/*`. No route handlers exist yet. |
| Booking lifecycle | `createBooking` (family) → `assignCompanion` (admin) → `respondToAssignment` (companion) → `startVisit` → `completeVisit` → `submitVisitReport` → `submitReview`. Status enum with 10 states; timeline UI. Phone bookings via `createPhoneBooking`. |
| SOS lifecycle | `raiseElderSos` (public, keyed by elder access code) and `raiseCompanionSos` → `EmergencyAlert` (ACTIVE) → admin `acknowledgeAlert` → `resolveAlert` (note required) → family notified. Family can acknowledge from dashboard. |
| Messaging | Booking-scoped threads + per-user support threads. Access rule centralised in `canAccessThread`. Read state = comma-separated user-id string per message. 15 s client polling. |
| Notifications | In-app only (`Notification` model, `lib/notify.ts`). No email/SMS/push. Unread badge in shell. |
| Payments | Simulated. `PaymentProvider` interface + `demoProvider` (`lib/payments.ts`). One `Payment` row per booking; statuses incl. cash flows. No intents, idempotency keys, webhooks, refund records, or ledgers. |
| File uploads | **Simulated everywhere** — verification documents, report photos and message attachments are validated *file names* only. No bytes are stored. |
| Audit logging | `AuditLog` model + `logAudit()`; covers companion verification, assignment, status/payment overrides, phone bookings, alert ack/resolve, incident updates, document submission. **No auth events.** |
| Middleware/proxy | None (`proxy.ts` not present). All protection lives in layouts/pages/actions — acceptable because no protected route handler exists, but there is no defense-in-depth layer. |
| Environment | `.env` (`DATABASE_URL`, `SESSION_SECRET`); no startup validation; `SESSION_SECRET` has an insecure in-code fallback. |

## 2. Existing strengths

- Every mutation is a Server Action with Zod server-side validation and role checks inside the action (not only in the UI). Spot-checks found **no action that trusts a client-provided role or price**; totals are always recomputed server-side from the `Service` table.
- Ownership scoping is consistently expressed in Prisma `where` clauses (`familyId`, `assignment.companionId`), which prevented IDOR in all sampled family/companion actions.
- Verified-only assignment is enforced server-side (`assignCompanion` rejects non-VERIFIED companions).
- Clean provider seam for payments already exists; booking code never touches provider details.
- Warm, consistent UI system; localisation seam (`lib/i18n.ts`); accessibility basics (focus rings, labels, reduced motion).
- Deterministic test harness (Vitest + Next API stubs) covering the core lifecycle, SOS and verification rules.
- Audit log already wired through privileged admin mutations.

## 3. Critical risks (fix in this pass)

1. **Sessions cannot be revoked.** The stateless signed cookie stays valid for 7 days even after password change, role change, or account deactivation is only caught because `getCurrentUser` re-reads the user — but a stolen cookie cannot be invalidated, and there is no session listing. → DB-backed sessions (Phase 2).
2. **Elder access codes are brute-forceable.** `SAHARA` + 3 digits ≈ 900 combinations, and `raiseElderSos`/`lookupElderScreen` are unauthenticated and unthrottled → an attacker can enumerate codes, read visit schedules/family phone numbers, and spam SOS alerts (alarm fatigue is a safety issue). → Longer random codes + rate limiting + constant-response behaviour.
3. **No rate limiting anywhere** (login, register, password paths, SOS). Credential stuffing and abuse are unimpeded. → Throttling + lockout (Phase 2/11).
4. **`SESSION_SECRET` insecure fallback** compiled into the app; missing env validation means production could silently run with the dev secret. → Startup env validation, refuse weak secret in production (Phase 11/12).
5. **SQLite as primary store** — single-writer, no server, file on disk; unsuitable for production concurrency and backup practices. → PostgreSQL baseline (Phase 1).
6. **Seed script destroys all data unconditionally** (`deleteMany` on every table) and could be pointed at a production database by mistake. → Production guard (Phase 1).
7. **No account recovery or verification** — no password reset, no email/phone verification; a locked-out family has no path back; no proof of contact ownership for safety-critical notifications. → Phase 2.

## 4. High-priority gaps

- **No security headers** (CSP, HSTS, frame-ancestors, Referrer-/Permissions-Policy) and no explicit Server-Action origin allow-list. (Phase 11)
- **No auth audit events** (login success/failure, logout, resets, revocations). (Phase 2)
- **Concurrency and duplicate-submission risks:**
  - `nextBookingCode` does read-max-then-insert; concurrent submissions can collide (unique constraint saves integrity but surfaces as a 500, and double-click submits two bookings — no idempotency).
  - `assignCompanion` has **no overlapping-visit check** for the companion.
  - `respondToAssignment` / `startVisit` / `completeVisit` guard by status inside a query then write in a transaction — acceptable, but accept/reject race on the same assignment resolves by last-write; needs status-guarded updates inside the transaction.
  - `payBooking` double-submit can double-charge once a real provider exists (no idempotency key / intent record).
- **Missing DB indexes** for operational queries (booking status+date, assignment companion+status, alert status, notification unread, message thread+createdAt, payment status, verification status). SQLite hid this; Postgres baseline must add them. (Phase 1)
- **File architecture is simulation-only**; verification documents are the most sensitive data the product will hold and currently have no storage, no lifecycle, no access audit. (Phase 4)
- **Admin is a single undifferentiated role**; sensitive overrides (booking/payment status) don't require a reason. (Phase 3 adds reasons; sub-roles → roadmap)
- **No structured logging, no health/readiness endpoints, no error tracking seam.** (Phase 12)
- **In-memory anything won't scale horizontally** — any rate limiter or queue introduced now must be documented as single-instance until a shared store exists.

## 5. Medium-priority gaps

- `Message.readBy` as a comma-joined string: unindexable, racy read-marking loop (N updates per view). Works at MVP scale; model a `MessageRead` join table later (roadmap).
- Timezone handling: dates stored as UTC (Prisma default) but formatted with the **server's** locale/timezone and labelled "NPT" by convention. Needs explicit `Asia/Kathmandu` formatting for visit times and viewer-timezone display for family. (Partially addressed in Phase 1; full solution roadmap.)
- Monetary values are integer NPR (whole rupees) — sound choice; must stay integer in Postgres and be documented (no floats). Paisa precision not required at current pricing.
- `lookupElderScreen` returns family phone + schedule for a valid code — correct feature, but data minimisation depends entirely on code secrecy (see Critical #2).
- Booking `thread` is created for family bookings but messaging notifications assume both parties exist; admin-less support flow depends on `notifyAdmins` scanning all admins per event (fine now; queue later).
- No pagination on admin lists beyond `take: 100`.
- Demo payment provider auto-succeeds; UI communicates this honestly, but the `Payment.status=PAID` transition has no attempt/intent record for reconciliation. (Phase 8 roadmap; intent groundwork optional.)

## 6. Low-priority improvements

- `formatDate*` helpers duplicated logic; fine.
- Some admin pages re-query reporter users manually (`incidents` page) — could be a relation.
- `AutoRefresh` polling always on in threads — could pause when tab hidden.
- Emoji icons as UI glyphs — consistent with design, but consider aria labelling review (Phase 13 roadmap).
- Vitest stubs re-implement `next/headers` cookies loosely (no `getAll`); adequate.

## 7. Recommended implementation order (this pass)

1. **Phase 1** PostgreSQL baseline (schema + constraints + indexes + scripts + seed guard) — everything else builds on the new schema, so new auth/file models ride in the same clean baseline migration.
2. **Phase 2** DB sessions, verification/reset tokens, throttling, auth audit.
3. **Phase 3** Central policy module + reasons for admin overrides + IDOR tests.
4. **Phase 4** File storage provider + private local adapter + wired companion-document upload + download authorization.
5. **Phase 11** Headers, origin protection, env validation, body limits.
6. **Phase 12** Structured logging + redaction, request IDs, health/readiness, provider status.
7. Test expansion + runbooks + roadmap for Phases 5–10, 13–14.

## 8. Assumptions made

- No Docker on this machine; PostgreSQL 18 service exists locally but its superuser password is not available to this session. Local verification therefore uses an **embedded PostgreSQL** dev instance (npm-managed, isolated, known credentials, port 5433); `docker-compose.yml` is provided for standard environments, and any external Postgres works by setting `DATABASE_URL`.
- Single-instance deployment is acceptable short-term: in-process rate limiting is implemented with that documented limitation.
- Whole-rupee integer pricing remains the money representation.
- Existing UI flows are behaviourally frozen; new capability surfaces (verify banner, sessions list, upload field) must adopt the existing design system without redesign.
- Demo/testing continues to rely on seeded accounts; production must never run the seed (guarded).
