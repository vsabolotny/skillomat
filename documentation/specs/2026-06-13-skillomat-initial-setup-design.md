# Skillomat — Initial Setup (MOB-1)

**Status:** Approved (design)
**Date:** 2026-06-13
**Ticket:** [MOB-1](https://vladworkinghard.atlassian.net/browse/MOB-1) — "Initial setup"

## Goal

Stand up the **Skillomat** monorepo foundation plus runnable, end-to-end skeletons
for the **backend** (Laravel + MySQL) and **web** (Vite + React + TypeScript),
orchestrated locally via **Docker Compose**.

Skillomat is a mobile marketplace where travelers offer their skills wherever they
go — earning money or trading work for goods, stays, or experiences. This ticket
delivers only the foundation everything else builds on; no product features yet.

Success criteria: `docker compose up` boots `mysql`, `backend`, and `web`; the web
landing page calls the backend health endpoint, which in turn confirms the database
connection — proving the full **web → backend → MySQL** wiring locally.

## UX / behavior

There is no product UX in this ticket. The only user-facing surface is a developer
health page: the web app's landing page shows a status badge — green
**"connected"** when `GET /api/health` returns `{"status":"ok","database":"connected"}`,
red **"unreachable"** when the backend or DB cannot be reached.

## Technical approach

### Repo structure

```
skillomat/
├── backend/                  # Laravel app (PHP 8.4) + Dockerfile (nginx + php-fpm)
├── web/                      # Vite + React + TypeScript SPA + Dockerfile
├── infra/                    # README placeholder for AWS IaC (Terraform) — deferred
├── documentation/
│   ├── specs/                # design docs (this file)
│   └── kb/                   # knowledge base
├── .github/workflows/ci.yml  # lint + test for both stacks
├── docker-compose.yml        # mysql + backend + web
├── .gitignore
├── .editorconfig
├── README.md
└── LICENSE                   # proprietary / UNLICENSED
```

### Docker services (local)

- **mysql** — MySQL 8.4, named volume for persistence, healthcheck on the port.
- **backend** — Laravel served via nginx + php-fpm; env points DB host at the
  `mysql` service. Waits for the db healthcheck before serving.
- **web** — Node 24 running the Vite dev server; proxies `/api/*` to the `backend`
  service so the SPA and API share an origin in development.

### End-to-end "hello world"

- **Backend:** `GET /api/health` runs a lightweight `SELECT 1` against MySQL and
  returns `{"status":"ok","database":"connected"}` (200) or a degraded payload with
  `"database":"unreachable"` if the DB ping fails.
- **Web:** the landing page fetches `/api/health` on mount and renders a status
  badge reflecting the result.

### Versions & tooling (chosen defaults)

- PHP **8.4** (required by Laravel 13), **Laravel 13**, **MySQL 8.4**, **Node 24 LTS**, **React 19**.
- Web package manager: **npm**.
- Lint/format: **Laravel Pint** (backend); **ESLint + Prettier + `tsc --noEmit`** (web).
- License: proprietary / **UNLICENSED**.

### CI (GitHub Actions)

On pull request, two jobs:
- **backend** — install Composer deps, run Pint (check), run PHPUnit (against
  Laravel's default in-memory SQLite test database; the health test's `SELECT 1`
  is database-agnostic).
- **web** — install npm deps, run ESLint, `tsc`, and Vitest.

## Test plan

Functional tests ship with this ticket (not a follow-up):

- **Backend (PHPUnit):** feature test on `GET /api/health` asserting 200 and the
  JSON shape, covering the DB-connected branch.
- **Web (Vitest + React Testing Library):** render the status component for both the
  "connected" and "unreachable" fetch outcomes (fetch mocked).

## Out of scope (explicit)

- React Native mobile app.
- AWS / CloudFront / Terraform / any cloud deploy (folder placeholder only).
- Authentication and user accounts.
- Real marketplace domain models (users, listings, bookings, payments, bartering).
- Redis, Adminer, Mailpit, queues, mail.

Each of these becomes its own ticket (MOB-2, MOB-3, …).

## Open questions / notes

- **Greenfield base branch:** the repository has zero commits on local and remote.
  There is no `main` to branch from or PR into. The bootstrap commit that seeds
  `main` must happen as part of landing this work; the exact mechanics (seed `main`,
  then PR `feature/MOB-1-initial-setup` into it) are handled at the push step.
