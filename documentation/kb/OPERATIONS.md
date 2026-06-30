# Operations

<!-- Last updated: 2026-06-18 (PR #5) -->

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

GitHub runs GitGuardian secret scanning on PRs.

## Deploy workflows (MOB-3)

Two path-filtered workflows fire on `push → main`:

| Workflow              | Triggers on (paths)                                          | What it does                                                                                              |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `deploy-web.yml`      | `web/**`, the workflow file                                  | `npm ci` → `npm run build` → `aws s3 sync dist/` → CloudFront invalidation → frontend smoke test          |
| `deploy-backend.yml`  | `backend/**`, `docker-compose.prod.yml`, the workflow file   | AWS SSM `send-command` to the EC2 host → `git reset` → `DOCKER_BUILDKIT=1 docker build` → `compose up -d` → `/api/health` curl → smoke test |

Both need GitHub secrets (`AWS_DEPLOY_ACCESS_KEY`/`_SECRET_KEY`, `EC2_INSTANCE_ID`,
`S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `CLOUDFRONT_URL`). Until the one-time AWS
setup + secrets exist, these runs fail at the `configure-aws-credentials` step.

## Deploy (AWS MVP — MOB-3)

First public deployment: one CloudFront distribution fronts both tiers —
`default → S3` (React build), `/api/* → EC2 Elastic IP` — so the SPA's relative
`/api` calls stay same-origin. The EC2 host (Amazon Linux 2023, `eu-central-1`)
runs `docker-compose.prod.yml`: the backend container + MySQL (named volume,
nightly EBS snapshots via DLM). No RDS / ALB / Redis in the MVP.

The AWS resources (EC2, S3, CloudFront, IAM, secrets) are provisioned **manually,
once**, per the runbook in
`documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md`. Host-side config:
`docker-compose.prod.yml`, `deploy/ec2-bootstrap.sh`, `deploy/smoke-tests.sh`,
`backend/.env.production.example`.

### Production environment variables

In production every value is supplied via the host `/opt/skillomat/.env` (mode 600,
gitignored) and consumed by `docker-compose.prod.yml` variable substitution — not
baked into the image. `APP_ENV=production`, `APP_DEBUG=false`, and `APP_KEY` is
**generated once and pinned** (never regenerated on deploy). The backend entrypoint
caches config + routes when `APP_ENV=production`. Additional prod vars:
`APP_URL` / `APP_FRONTEND_URL` (the CloudFront URL), `DB_ROOT_PASSWORD`, and the
mail vars below.

### Email (SES) — MOB-7

Production transactional email (currently just the MOB-2 password-reset link) is sent
through **AWS SES**. Until SES is provisioned the host keeps `MAIL_MAILER=log`, which
writes emails to `storage/logs` instead of delivering them. The app code is already
wired (`aws/aws-sdk-php` + the `ses` mailer in `config/mail.php`); the remaining work is
a one-time AWS setup the operator does by hand. Region must match `AWS_DEFAULT_REGION`
(default `eu-central-1`, the EC2 host region) — SES identities are per-region.

One-time provisioning:

1. **Verify a sender identity** in SES (`eu-central-1`). With no custom domain yet,
   verify a single email address; click the confirmation link SES emails you. Set
   `MAIL_FROM_ADDRESS` in the host `/opt/skillomat/.env` to that exact address.
2. **DKIM + SPF.** If/when a domain is verified, enable Easy DKIM (add the 3 CNAME
   records SES gives you) and an SPF TXT record (`v=spf1 include:amazonses.com ~all`)
   so mail isn't spam-filtered. A bare verified email address skips DNS but has weaker
   deliverability.
3. **Leave the sandbox.** New SES accounts can only send to verified addresses — request
   production access to send to anyone.
4. **Grant send permission.**
   - *Preferred — IAM instance role (no stored secret):* attach a policy allowing
     `ses:SendEmail` + `ses:SendRawEmail` to the EC2 instance profile, and leave
     `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` **unset** in the host `.env`. The AWS
     SDK reads credentials from instance metadata.
   - *Fallback — static IAM user:* create a dedicated SES user with the same policy and
     put its keys in the host `.env`. Long-lived secret to rotate; only use if an
     instance role isn't an option.
5. **Flip the switch.** Set `MAIL_MAILER=ses` in the host `.env` and
   `docker compose -f docker-compose.prod.yml up -d backend`.

Smoke test from the host:
`docker compose -f docker-compose.prod.yml exec backend php artisan tinker`
→ `Password::sendResetLink(['email' => '<a-verified-address>']);`
Confirm the email arrives (check spam) with the reset link pointing at the CloudFront
SPA `/reset-password` route.
