# साहारा — Operations Runbook

Audience: whoever is on duty for the साहारा platform.
Companion documents: `SOS_RUNBOOK.md`, `BACKUP_AND_RESTORE.md`, `SECURITY_MODEL.md`.

---

## 1. Service overview

| Component | What it is | Failure impact |
| --- | --- | --- |
| Next.js app | UI + Server Actions + `/api/files`, `/api/health`, `/api/ready` | Total outage — families cannot book, companions cannot report, **SOS cannot be raised in-app** |
| PostgreSQL | Primary datastore | Total outage |
| File storage | Private object storage / `storage/uploads` | Uploads and document review fail; rest of app works |
| Mail provider | Verification and reset emails | New sign-ups cannot verify; password reset blocked |

## 2. Health checks

```bash
curl -sS https://<host>/api/health   # {"status":"ok"} — process alive
curl -sS https://<host>/api/ready    # {"ready":true}  — DB reachable
```

`/api/ready` returns `503` when the database check fails. Component detail
(mail/payment/storage provider, scheduled jobs) is returned **only** to an
authenticated ADMIN session — do not expect it from an unauthenticated probe.

Configure the load balancer against `/api/ready` and alert on two consecutive
failures.

## 3. Deployment

```bash
npm ci
npx prisma migrate deploy     # never `migrate dev` in production
npm run build
npm start
```

Required environment: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (long,
random, non-default — the app refuses to boot otherwise), `APP_URL`.
Optional: `ALLOWED_ORIGINS` when behind a proxy/CDN.

**Never** run `npm run db:seed` in production; the seed refuses unless
`NODE_ENV != production`, the database is local, or `SEED_FORCE` is set.

Rollback: deploy the previous build artefact. Migrations are forward-only —
if a migration must be undone, write a new corrective migration (see
`BACKUP_AND_RESTORE.md` for data recovery).

## 4. Alerting hooks

The logger emits structured JSON; route `level: "critical"` lines to paging.
Alert on:

| Signal | Where it comes from | Response |
| --- | --- | --- |
| `SOS raised` | `lib/actions/sos.ts` | Follow `SOS_RUNBOOK.md` immediately |
| SOS unacknowledged > 5 min | Admin emergency queue (manual today; automated in Phase 6) | Escalate per SOS runbook |
| Emergency notification failure | Notification delivery records (Phase 5) | Call the family/contact directly |
| Repeated `auth.login.failed` for one account | `AuditLog` | Check for credential stuffing; consider forcing a reset |
| `readiness: database check failed` | `/api/ready` | Section 5 below |
| Failed payment webhook | Phase 8 | Reconcile manually; do not double-charge |

## 5. Common incidents

**Database unreachable** — confirm with `/api/ready`; check the managed
instance's status, connection count and disk. If the pool is exhausted,
restart app instances after confirming the database itself is healthy.

**Login failures across many users** — check whether `SESSION_SECRET` changed
(rotating it invalidates nothing directly, since sessions are DB-backed, but a
misconfigured deploy may break cookie handling), then check the `AuditLog` for
`auth.login.failed` volume and the rate limiter (in-process: a restart clears
limits; sustained abuse needs a WAF rule).

**A user is locked out** — lockout is 15 minutes after 10 failures. To clear it
early, an operator with database access sets `failedLoginCount = 0` and
`lockedUntil = NULL` for that user. Record why in the incident log.

**Suspected account compromise** — revoke sessions (`Session.revokedAt = now()`
for that user), force a password reset, and review `AuditLog` for that actor.

**Suspicious file uploaded** — set the `StoredFile.status` to `QUARANTINED`;
non-admins immediately lose access. Review `file.accessed` audit entries.

## 6. Incident response procedure

1. **Declare** — note start time, severity, and who is coordinating.
2. **Stabilise** — restore service first (roll back, scale, fail over); avoid speculative config edits.
3. **Communicate** — for anything affecting bookings or safety, tell families and companions plainly; never imply साहारा replaces emergency services.
4. **Preserve evidence** — export relevant `AuditLog` rows and logs before cleanup.
5. **Resolve and verify** — confirm with `/api/ready` plus a manual login, booking view and SOS drill (use a drill alert, not a real one).
6. **Review within 5 working days** — timeline, root cause, corrective actions with owners. Security incidents also follow the disclosure obligations in `SECURITY_MODEL.md`.

## 7. Routine operations

- Weekly: review open incidents, unacknowledged alerts, failed logins, disk/DB growth.
- Monthly: verify a restore (`BACKUP_AND_RESTORE.md`), review admin accounts and audit-log volume, `npm audit` review.
- Quarterly: rotate `SESSION_SECRET` (users are signed out on next expiry — announce first), review companion document retention/expiry.
