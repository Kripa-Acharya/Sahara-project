# साहारा — Security Model

Scope: the application as it stands after the production-hardening pass
(Phases 0–4, 11, 12). Anything not implemented is listed under
[Known gaps](#known-gaps) and tracked in `PRODUCTION_ROADMAP.md`.

---

## 1. Assets, in order of sensitivity

1. **Elder safety** — SOS alerts reaching a human quickly; correct emergency contacts.
2. **Companion identity documents** — citizenship/ID scans, police reports.
3. **Elder personal data** — home address, mobility, minimal health notes, routines.
4. **Family account access** — bookings, payments, visit reports, messages.
5. **Financial records** — payment status and (future) real transactions.
6. **Operational integrity** — audit trail, verification decisions.

## 2. Threat actors

| Actor | Capability assumed |
| --- | --- |
| Opportunistic internet attacker | Automated credential stuffing, endpoint scanning, code enumeration. |
| Malicious/curious authenticated user | Valid session; attempts IDOR by editing IDs in requests or invoking Server Actions directly. |
| Rejected or suspended companion | Knows the domain and flows; may retain a stale session or try to reach documents. |
| Insider (admin) | Legitimate broad access; controlled by audit logging and reason requirements, not prevention. |
| Network attacker | Passive interception (mitigated by TLS/HSTS in production). |

## 3. Implemented controls

### Authentication
- scrypt password hashing with per-password salt (`lib/password.ts`).
- **Server-side sessions**: cookie carries an opaque 256-bit token; only its SHA-256 hash is stored (`Session.tokenHash`). Cookies are `httpOnly`, `SameSite=Lax`, `Secure` in production.
- Sessions can be **listed and revoked** per device; password change and password reset revoke all sessions and rotate the current one.
- **Login throttling** (per IP+email) and **progressive lockout** (10 failures → 15 min).
- **Generic authentication errors** — wrong password, unknown account, inactive account and locked account all return the same message; password-reset requests return an identical response whether or not the account exists. No enumeration oracle.
- **Email verification** and **password reset** use single-use, hashed, expiring tokens (24 h / 30 min), invalidated when a newer token of the same type is issued.
- Auth events audit-logged: login success/failure/locked/inactive, logout, registration, email verification, password reset requested/completed, password change, session revocation.

### Authorization
- Central policy module (`lib/policies.ts`): `canViewElder`, `canEditElder`, `canViewBooking`, `canManageBooking`, `canViewVisitReport`, `canAcknowledgeVisitReport`, `canMessageInThread`, `canViewSensitiveDocument`, `canManageCompanionVerification`, `canManageSOS`.
- Every Server Action re-authorizes the actor server-side; the UI never carries authority. Policies return `null` (treated as *not found*) rather than 403, so resource existence is not disclosed.
- Companions see a booking only while holding a `PENDING`/`ACCEPTED` assignment for it; elder care details are shared only with the family's recorded consent.
- Only `VERIFIED` companions can be assigned to visits (server-enforced).
- Sensitive admin overrides (booking status, payment status) require a reason and are audit-logged as `*.override`.

### Files
- Uploads validated on **extension + declared MIME + magic bytes + size** (≤ 5 MB). A spoofed `.pdf` containing an executable is rejected.
- Storage keys are server-generated and opaque; paths are confined to the storage root (traversal is structurally impossible).
- Bytes live in `storage/uploads` (gitignored, **never** under `/public`); the only read path is `GET /api/files/[id]`, which re-checks authorization on every request and returns `404` for unauthorized access, `401` when anonymous.
- Lifecycle statuses `PENDING → SCANNING → AVAILABLE | QUARANTINED | DELETED`; a "dirty" scan verdict quarantines and never links the file. Verification-document reads are audit-logged (`file.accessed`).
- Responses set `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment`, `Cache-Control: private, no-store`.

### Transport and request protection
- Headers (all routes): CSP (`default-src 'self'`, `frame-ancestors 'none'`, no external hosts), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation/payment/USB denied), and **HSTS in production**.
- Server Actions: Next.js compares `Origin` against `Host` (CSRF protection); `ALLOWED_ORIGINS` configures proxy hostnames. Request bodies capped at 8 MB.
- Rate limiting on login, registration, password reset, elder-code lookup and SOS raise.
- Environment validation at startup (`instrumentation.ts` → `lib/env.ts`): production refuses to boot without a PostgreSQL `DATABASE_URL`, a strong non-default `SESSION_SECRET`, or `APP_URL`.

### Data integrity
- Booking creation is idempotent (client-generated UUID + unique constraint) — double-clicks and retries produce one booking.
- Assignment accept/reject uses status-guarded updates inside a transaction (no last-write-wins race).
- A companion cannot be assigned to two overlapping active visits.
- Prices are always recomputed server-side from the `Service` table; client-supplied amounts are never trusted.
- Foreign keys use explicit `Cascade`/`Restrict`/`SetNull`; money is integer NPR; all timestamps are `timestamptz` (UTC) rendered in Asia/Kathmandu.

### Logging and secrets
- Structured JSON logs with automatic redaction of keys matching password/token/secret/cookie/authorization/accessCode/recovery/otp/email/phone.
- Password-reset and verification links are written to `storage/dev-mailbox/` in development, never to application logs.
- Health (`/api/health`) is public and detail-free; readiness (`/api/ready`) exposes component detail only to an authenticated ADMIN.
- Demo seed refuses to run in production or against a non-local database.

## 4. Residual risks and accepted trade-offs

- **Rate limiting is in-process.** Correct for a single instance; multi-instance deployments must move it behind a shared store (the call sites are already abstracted).
- **Elder access codes** remain a shared secret with no second factor: 6 characters from a 31-character alphabet (~10⁹ combinations) plus per-IP throttling. Acceptable for a read-mostly screen showing one elder's next visit; device-bound links are the planned upgrade.
- **CSP allows `'unsafe-inline'`** for scripts/styles because of Next.js's inline runtime; nonce-based CSP is a roadmap item.
- **Admin is one role.** Sub-role separation (operations/verification/finance/emergency/super-admin) is designed but not implemented; every privileged action is audit-logged in the meantime.
- **Malware scanning is a no-op in development.** Files are marked clean by the dev scanner; production must wire a real engine before accepting public uploads.
- **No email/SMS delivery in production yet** — the mail provider seam exists with a development adapter only, so account recovery depends on configuring a real provider.

## 5. Known gaps (not implemented)

Multi-channel notifications and delivery records (Phase 5), full SOS escalation state machine (Phase 6), scheduling policies and recurring bookings (Phase 7), payment intents/webhooks/ledgers (Phase 8), versioned consent and data-export/deletion (Phase 9), PWA/offline (Phase 10), the deeper accessibility programme (Phase 13), and E2E/browser tests (Phase 14). See `PRODUCTION_ROADMAP.md`.

## 6. Verification

Automated coverage lives in `tests/`: `auth-security.test.ts` (throttling, lockout, token single-use/expiry, reset revocation, session revocation and cross-user protection), `authorization.test.ts` (IDOR across elders/bookings/threads/documents, admin reason enforcement), `file-security.test.ts` (spoofed types, oversize, download authorization matrix), `booking-integrity.test.ts` (idempotency, overlap), `seed-safety.test.ts` (production guard).
