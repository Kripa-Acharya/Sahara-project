# साहारा (Sahara)

**तपाईं टाढा भए पनि तपाईंको माया जहिले सँगै हुन्छ।**
**You may be far. Your care does not have to be.**

साहारा (Nepali for *support*) connects elderly people living in Nepal with verified local
companions, so that family members living abroad can arrange everyday help, important errands,
and meaningful human connection — and stay in the loop with visit reports, messaging, and
emergency alerts.

Repository: <https://github.com/Kripa-Acharya/Sahara-project>

> **Demo MVP** — payments are simulated, document/photo uploads are simulated with file names,
> and all people in the seed data are fictional. See [Current limitations](#current-limitations).

---

## Technology stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Actions, Turbopack)  |
| Language   | TypeScript (strict)                                 |
| UI         | Tailwind CSS 4 + small reusable component library   |
| Database   | PostgreSQL 18 via Prisma ORM 6                      |
| Auth       | Credential auth (scrypt) + server-side sessions, email verification, password reset, login throttling |
| Validation | Zod (server-side) + native form validation          |
| Tests      | Vitest (server actions against a real PostgreSQL test database) |

Architecture: a simple **modular monolith** — UI pages, server actions (`lib/actions/*`),
shared services (`lib/*`), and Prisma data access. No microservices, queues, or Docker.

## Prerequisites

- Node.js 20.9+ (Node 22+ recommended)
- npm 10+
- PostgreSQL 18 — via Docker (`docker compose up -d`) **or** a local
  PostgreSQL installation (`npm run db:up` manages an isolated cluster in
  `.pgdev/` on port 5433, without touching any system database)

## Installation

```bash
git clone https://github.com/Kripa-Acharya/Sahara-project.git
cd Sahara-project
npm install
```

### Environment variables

Copy the example file and adjust if you like (the defaults work for local development):

```bash
cp .env.example .env
```

| Variable          | Purpose                                                        | Required            |
| ----------------- | -------------------------------------------------------------- | ------------------- |
| `DATABASE_URL`    | PostgreSQL connection string used at runtime                    | always              |
| `DIRECT_URL`      | Non-pooled connection for `prisma migrate` (same value unless you use a pooler) | always |
| `SESSION_SECRET`  | Secret material for sessions. Must be long, random and non-default in production — the app refuses to boot otherwise | always |
| `APP_URL`         | Public base URL, used in emailed verification/reset links       | production          |
| `ALLOWED_ORIGINS` | Comma-separated public hostnames when behind a proxy/CDN (Server-Action origin check) | optional |

### Database setup

**With Docker (recommended):**

```bash
docker compose up -d
```

**Without Docker** (uses a locally installed PostgreSQL's binaries to run an
isolated cluster in `.pgdev/` on port 5433 — your system databases are never
touched; set `PG_BIN` if the binaries aren't on `PATH`):

```bash
npm run db:up
```

Then apply migrations and load demo data:

```bash
npm run db:setup      # prisma migrate deploy + seed
```

Individual commands: `npm run db:deploy` (migrations only), `npm run db:seed`
(demo data), `npm run db:migrate` (create a new migration in development),
`npm run db:reset` (drop, re-migrate, re-seed), `npm run db:down` (stop the
local cluster).

> The seed **deletes all data** and refuses to run when `NODE_ENV=production`
> or when `DATABASE_URL` is not local.

**Production** uses `npx prisma migrate deploy` only — never `migrate dev`.

### Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

### Tests, lint, types

```bash
npm test          # Vitest — core flows against a scratch SQLite database
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

## Demo accounts

| Role                | Email                   | Password        |
| ------------------- | ----------------------- | --------------- |
| Family (Australia)  | `family@sahara.demo`    | `Family@123`    |
| Verified companion  | `companion@sahara.demo` | `Companion@123` |
| Companion applicant | `applicant@sahara.demo` | `Applicant@123` |
| Administrator       | `admin@sahara.demo`     | `Admin@123`     |

**Elder screen:** open `/elder` and enter access code **`SAHARA1`** — no login needed.
(Each elder profile gets its own code, shown on the elder's profile page in the family
dashboard.)

## Main user flows

**Family (living abroad)** — log in → create/manage elder profiles (address, language,
mobility, health notes, emergency contacts, consent) → book a visit in four steps (elder →
services → date/time/instructions → review + demo payment) → track the booking on a status
timeline → chat with the companion or Sahara support → read the visit report with photos →
rate the visit.

**Companion** — apply and submit verification documents (simulated) → track the ten-step
verification checklist → accept or decline assigned visits → see the elder's care notes
(shared with family consent) → start the visit → complete it → submit a structured report →
view earnings and ratings → raise SOS or report incidents when needed.

**Administrator** — overview dashboard with live emergency alerts → assign verified
companions to bookings → manage the verification checklist and approve/reject/suspend
companions → create phone bookings for callers without the app → manage services & pricing →
update booking/payment statuses → handle incidents and disputes → audit log of important
actions.

**Elder** — a large-button screen in Nepali or English showing the next visit and companion,
one-touch call to Sahara support, an SOS button that alerts the family and administrators,
a simple "yes, the visit happened" confirmation, and optional voice prompts.

**Emergency (SOS)** — raised from the elder screen or by a companion during a visit → alert
appears prominently on the admin and family dashboards with one-tap phone links (local
contact, family, companion, support) → admin acknowledges → resolves with a note that is sent
to the family. Sahara does not replace police, ambulance, or medical services — the UI states
this wherever SOS appears (Police 100 · Ambulance 102).

## Payment integration notes

Payments are **simulated**. `lib/payments.ts` defines a `PaymentProvider` interface
(`charge(...)`) with a single `demoProvider` implementation that always succeeds and returns
a fake reference. To integrate a real provider (eSewa, Khalti, a card gateway, or
remittance-linked payments):

1. Implement `PaymentProvider` for the real service (redirect/webhook flows will also need a
   callback route under `app/api/`).
2. Register it in `getPaymentProvider()`.
3. Store the provider key on the `Payment` record (field already exists).

Booking code never needs to change. Payment statuses supported end-to-end: Pending,
Authorized, Paid, Failed, Refunded, Cash due, Cash received.

## Security and operations documentation

| Document | Contents |
| --- | --- |
| [`docs/PRODUCTION_READINESS_AUDIT.md`](docs/PRODUCTION_READINESS_AUDIT.md) | Architecture map, risks, and the order they were addressed |
| [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md) | Threat model and every implemented control |
| [`docs/OPERATIONS_RUNBOOK.md`](docs/OPERATIONS_RUNBOOK.md) | Deploys, health checks, alerts, incident response |
| [`docs/SOS_RUNBOOK.md`](docs/SOS_RUNBOOK.md) | Emergency handling procedure and honest limitations |
| [`docs/BACKUP_AND_RESTORE.md`](docs/BACKUP_AND_RESTORE.md) | Backup policy and tested restore procedure |
| [`docs/PRODUCTION_ROADMAP.md`](docs/PRODUCTION_ROADMAP.md) | Backlog for notifications, SOS escalation, scheduling, payments, privacy, PWA, accessibility |

## Current limitations

- **Demo payments only** — no real money moves; no PCI scope. eSewa/Khalti/card
  integrations are not live; the `PaymentProvider` seam is ready for them.
- **Visit photos and message attachments are still file names**; companion
  verification documents are real, validated, privately stored uploads.
- **Malware scanning is a no-op in development** — wire a real engine before
  accepting uploads from the public.
- **Notifications are in-app only** — no email/SMS/push delivery yet, so SOS
  alerts are not guaranteed to reach someone who isn't looking at the app.
- **Rate limiting is per-process** — move it behind a shared store before
  running multiple instances.
- **Polling, not websockets** — messages refresh every ~15 s, which is sufficient for MVP.
- **Partial Nepali translation** — the elder screen and major labels are bilingual
  (`lib/i18n.ts`); most dashboard prose is English-first.
- **No email/SMS** — notifications are in-app only.
- **Elder access codes** are convenience-grade security (short codes for a low-sensitivity,
  read-mostly screen); production should use device-bound links or OTP.
- The MVP is **not** certified compliant with any medical or data-protection regulation.
- SQLite is for local development; the schema uses portable types/enums so PostgreSQL is a
  connection-string change plus regenerated migrations.

## Production-readiness recommendations

1. Switch `datasource` to PostgreSQL and regenerate migrations; run on a managed database.
2. Real object storage (S3/GCS) for documents and photos, with signed URLs and virus scanning.
3. Real payment providers behind the existing `PaymentProvider` interface, with webhooks.
4. Email + SMS notifications (critical for SOS), and push notifications for the family app.
5. Rate limiting and CSRF hardening on auth and SOS endpoints; rotate `SESSION_SECRET`.
6. Proper i18n framework (e.g. `next-intl`) for full Nepali coverage.
7. Monitoring, error reporting, and backups before onboarding real families.
8. A legal/privacy review covering elder consent, health notes, and data retention in Nepal
   and the family's countries of residence.

## Project structure

```
app/                 # Next.js App Router pages
  (public)/          # Landing, services, safety, login, register, …
  family/            # Family dashboard
  companion/         # Companion dashboard
  admin/             # Admin dashboard
  elder/             # Elder-friendly screen (access-code based)
components/          # Reusable UI (buttons, cards, timeline, messaging, …)
lib/                 # Services: db, auth, session, payments, i18n, labels
  actions/           # Server actions (business logic + validation)
prisma/              # Schema, migrations, seed
tests/               # Vitest suites + Next.js stubs
```
