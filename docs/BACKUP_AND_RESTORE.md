# साहारा — Backup and Restore

Covers the two stores that hold irreplaceable data: **PostgreSQL** and
**file storage** (companion verification documents, visit photos).

---

## 1. What must be backed up

| Store | Contents | Loss impact |
| --- | --- | --- |
| PostgreSQL | All 25 models: users, elders, bookings, visits, reports, payments, messages, alerts, audit log | Catastrophic — the product is the data |
| File storage | Verification documents, visit photos | Companions must re-submit; verification decisions lose evidence |
| Secrets | `SESSION_SECRET`, provider credentials | Stored in the platform's secret manager, **never** in backups or git |

The `AuditLog` table is evidence for verification and safety decisions — treat
it as the highest-value table and never prune it without a written retention
decision.

## 2. Backup policy (recommended baseline)

| Aspect | Setting |
| --- | --- |
| Automated snapshots | Daily, retained 30 days |
| Point-in-time recovery | Enabled, 7-day window (managed Postgres WAL) |
| Logical dumps | Weekly `pg_dump`, retained 90 days, stored in a **different** region/account from the database |
| File storage | Versioning + lifecycle rules on the bucket; cross-region replication |
| Encryption | At rest (provider-managed) and in transit; backups encrypted |
| Access | Restore permissions limited to named operators; every restore logged |

## 3. Manual logical backup

```bash
# Schema + data, custom format (compressed, selective restore possible)
pg_dump --format=custom --no-owner --no-privileges \
  --file=sahara-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"

# Verify the dump is readable before trusting it
pg_restore --list sahara-*.dump > /dev/null && echo "dump OK"
```

Store dumps outside the application server. They contain personal data
(addresses, health notes) — apply the same protection as production.

## 4. Restore procedure

> Practise this quarterly against a scratch database. An untested backup is a
> hypothesis, not a backup.

1. **Stop writes.** Take the app out of the load balancer (`/api/ready` will fail once the DB is detached) or scale to zero. Announce the outage.
2. **Provision a target** — a new empty database. Never restore over a live one until the restored copy is verified.
   ```bash
   createdb sahara_restore
   pg_restore --no-owner --no-privileges --dbname=sahara_restore sahara-YYYYMMDD-HHMM.dump
   ```
3. **Verify the restored copy** before cutover:
   ```sql
   SELECT count(*) FROM "User";
   SELECT count(*) FROM "Booking";
   SELECT max("createdAt") FROM "AuditLog";   -- how fresh is this data?
   ```
   Confirm the newest audit entry matches the expected recovery point.
4. **Check schema alignment.** Point `DATABASE_URL` at the restored database and run:
   ```bash
   npx prisma migrate deploy   # applies any migrations newer than the dump
   ```
5. **Cut over** — repoint `DATABASE_URL`, restart the app, confirm `/api/ready` returns `ready: true`, then manually verify: log in, open a family dashboard, open a booking, open the admin emergency queue.
6. **Restore files** if needed — file records reference `storageKey`; a database restored to an earlier point may reference objects deleted since (bucket versioning covers this) or lack rows for objects that exist (harmless orphans; clean up later).
7. **Record** the incident: what was lost, the recovery point, who authorised the restore.

## 5. Point-in-time recovery

For accidental destructive changes (bad migration, mistaken bulk delete),
PITR to a timestamp **just before** the event is preferable to a nightly dump:

1. Identify the exact time from `AuditLog` or application logs.
2. Restore the managed instance to that timestamp as a **new** instance.
3. Verify as in §4.3, then cut over.

## 6. Data loss without a full restore

If only some rows are affected, prefer a targeted repair over a full restore:
restore to a scratch instance, extract the affected rows, and re-insert them
with a documented, reviewed script. Never hand-edit production data without a
second operator reviewing the statement.

## 7. Retention and deletion

Backups inherit the personal data they contain, so a user's deletion request
(Phase 9) cannot be honoured inside existing backups — document this in the
privacy notice: deleted data disappears from live systems immediately and ages
out of backups within the retention window (90 days).
