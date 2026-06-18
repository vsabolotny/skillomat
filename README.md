# Skillomat

A marketplace where travelers offer their skills wherever they go — earning money
or trading their work for goods, stays, or experiences. People list what they can
do (cooking, repairs, design, tutoring, farm work, knowledge sharing…), and locals
or hosts hire or barter for it on the spot.

> **This repository is the initial setup (MOB-1).** It contains the monorepo
> foundation plus runnable skeletons for the backend and web, wired together with
> Docker Compose. There is no product functionality yet — see
> [`documentation/specs/2026-06-13-skillomat-initial-setup-design.md`](documentation/specs/2026-06-13-skillomat-initial-setup-design.md).

## Repository layout

| Path        | What it is                                                        |
| ----------- | ----------------------------------------------------------------- |
| `backend/`  | Laravel API (PHP 8.4) + MySQL, served by nginx + php-fpm          |
| `web/`      | React SPA (Vite + TypeScript) that consumes the API               |
| `infra/`         | Cloud/deploy notes — see [`infra/README.md`](infra/README.md) |
| `deploy/`        | Host-side deploy scripts (EC2 bootstrap, smoke tests)        |
| `documentation/` | Specs (`specs/`) and the knowledge base (`kb/`)              |

The mobile app (React Native) is a future ticket. AWS deployment (EC2 + S3 +
CloudFront) is wired up in MOB-3 — see
[`documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md`](documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md).

## Tech stack

- **Backend:** PHP 8.4, Laravel 13, MySQL 8.4
- **Web:** React 19, Vite, TypeScript
- **Local orchestration:** Docker Compose
- **Cloud (later):** AWS, CloudFront

## Quick start (Docker)

Prerequisite: Docker Desktop (with Compose).

```bash
docker compose up --build
```

This boots three services and wires them together:

| Service   | URL / port                        | Notes                                       |
| --------- | --------------------------------- | ------------------------------------------- |
| `web`     | http://localhost:5174             | React app (5174 to avoid 5173 collisions)   |
| `backend` | http://localhost:8080             | Laravel API (`/api/health`)                 |
| `mysql`   | localhost:3306                    | MySQL 8.4 (db/user `skillomat`)             |

Open **http://localhost:5174** — the page shows a status badge that turns green
("Backend connected") once the web app reaches the backend and the backend reaches
MySQL. You can also hit the API directly:

```bash
curl http://localhost:8080/api/health
# {"status":"ok","database":"connected"}
```

To stop: `docker compose down` (add `-v` to also drop the MySQL volume).

## Working on each app

You don't need Docker for the web app:

```bash
cd web
npm install
npm run dev        # http://localhost:5173, proxies /api -> http://localhost:8080
```

The backend expects PHP 8.4 + Composer if you run it outside Docker; otherwise use
the `backend` container.

## Tests, lint, typecheck

**Web** (from `web/`):

```bash
npm test           # Vitest
npm run typecheck  # tsc
npm run lint       # ESLint
```

**Backend** (from `backend/`, or via the container):

```bash
vendor/bin/phpunit     # PHPUnit (uses in-memory SQLite)
vendor/bin/pint --test # Laravel Pint (lint)
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs all of the above
on every pull request.

## Contributing

- Branch from `main`: `feature/<TICKET>-<slug>` or `fix/<TICKET>-<slug>`.
- Keep changes scoped to one ticket; open a PR for review before merging.
- Tests ship with the change, not as a follow-up.
- Never commit a real `.env` — only `.env.example` is tracked.
