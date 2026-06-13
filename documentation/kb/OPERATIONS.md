# Operations

<!-- Last updated: 2026-06-13 (PR #1) -->

## Local environment (Docker Compose)

`docker compose up --build` boots the full stack. There is no cloud deployment yet.

| Service   | Image / build        | Host port | Container port | Notes                                   |
| --------- | -------------------- | --------- | -------------- | --------------------------------------- |
| `mysql`   | `mysql:8.4`          | 3306      | 3306           | Volume `mysql-data`; healthcheck on ping |
| `backend` | `./backend`          | 8080      | 80             | nginx + php-fpm; waits for mysql healthy |
| `web`     | `./web`              | 5174      | 5173           | Vite dev server; depends on backend      |

Health probe: `curl http://localhost:8080/api/health` →
`{"status":"ok","database":"connected"}`.

## Environment variables

| Variable               | Used by   | Default (local)         | Purpose                                        |
| ---------------------- | --------- | ----------------------- | ---------------------------------------------- |
| `DB_CONNECTION`        | backend   | `mysql`                 | Laravel DB driver                              |
| `DB_HOST`              | backend   | `mysql`                 | DB host (compose service name)                 |
| `DB_PORT`              | backend   | `3306`                  | DB port                                        |
| `DB_DATABASE`          | backend   | `skillomat`             | DB name                                        |
| `DB_USERNAME`          | backend   | `skillomat`             | DB user                                        |
| `DB_PASSWORD`          | backend   | `secret`                | DB password (local dev only)                   |
| `MYSQL_ROOT_PASSWORD`  | mysql     | `rootsecret`            | Root password (local dev only)                 |
| `VITE_API_PROXY`       | web       | `http://localhost:8080` | Where the SPA proxies `/api/*`                 |
| `VITE_HMR_CLIENT_PORT` | web       | `5174` (Docker)         | Browser-facing port for Vite HMR over mapping  |

`backend/.env` is created from `backend/.env.example` on first container boot; the
entrypoint runs `php artisan key:generate` if no `APP_KEY` is present. Real `.env`
files are never committed (only `.env.example`).

## CI

`.github/workflows/ci.yml` runs on every pull request and on push to `main`.

| Job                | Steps                                                              |
| ------------------ | ----------------------------------------------------------------- |
| Backend (Laravel)  | `composer install` → Pint (`--test`) → PHPUnit (in-memory SQLite) |
| Web (React)        | `npm ci` → ESLint → `tsc` typecheck → Vitest                       |

There are **no deploy workflows** yet — merging to `main` triggers only CI. GitHub
runs GitGuardian secret scanning on PRs.

## Deploy

Not yet implemented. AWS provisioning (RDS, ECS/Fargate or EC2, S3 + CloudFront)
is tracked under `infra/` and a future ticket.
