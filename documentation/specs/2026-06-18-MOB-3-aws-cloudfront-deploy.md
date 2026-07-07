# Skillomat — Publish in the cloud behind CloudFront (MOB-3)

**Ticket:** [MOB-3](https://vladworkinghard.atlassian.net/browse/MOB-3) — "Publish in
the cloud and cloudfront"

> Description: *"It should run in cloudfront URL publicly (we don't have a domain yet)."*

**Status:** Approved (Gate 1) — implementing.

**Decisions locked at Gate 1:** region **`eu-central-1`**; backend deploy via **AWS
SSM `send-command`** (keyless); **reuse the existing AWS account/profile** (the
runbook references it rather than creating account-level setup).

**Reference:** Adapted from the DrinkWise AWS MVP deployment
(`erp-europa-lab/drinkwise`): web on S3 + CloudFront, backend on a single EC2 host,
both served under **one** CloudFront domain, deployed by two GitHub Actions
workflows.

## Goal

Make Skillomat reachable on the public internet at a CloudFront URL
(`https://<id>.cloudfront.net`) — no custom domain yet. The cheapest viable
production footprint: one EC2 host for the Laravel API + MySQL, an S3 bucket for the
React build, and a single CloudFront distribution that fronts both. Subsequent
`push → main` deploys automatically.

This is the first production deployment on top of MOB-1 (skeleton) and MOB-2 (auth).

## Why a single CloudFront distribution (not two origins on two domains)

`web/src/api.ts` calls the API at the **relative** path `/api` and auth is **Sanctum
Bearer tokens**. If web and API live on the *same* CloudFront domain, then:

- the SPA's `/api/*` calls are **same-origin** → no CORS config, no preflight;
- email links / the Google OAuth return URL just use the one CloudFront origin;
- there is nothing to reconfigure when the CloudFront domain is created.

So: **default behavior → S3 (SPA); `/api/*` behavior → EC2 origin.** This mirrors
DrinkWise.

## Target architecture

```
                ┌──────────────────────────────────────────────┐
  User Browser  │            CloudFront Distribution           │
  ───────────►  │  default (*)   → S3  (React SPA, via OAC)     │
   (HTTPS)      │  /api/*        → EC2 Elastic IP (HTTP :80)    │
                └──────────────────────────────────────────────┘
                                        │ HTTP (CloudFront → origin)
                                        ▼
                           ┌─────────────────────────────┐
                           │  EC2 t3.small (AL2023)      │
                           │  Elastic IP attached        │
                           │  docker compose -f prod:    │
                           │   • backend (nginx+php-fpm  │
                           │     in one container, :80)  │
                           │   • mysql:8.4 (named vol)   │
                           │  + nightly EBS snapshot (DLM)│
                           └─────────────────────────────┘
```

### Differences from DrinkWise (because the stack differs)

| DrinkWise | Skillomat |
| --- | --- |
| FastAPI + Postgres + Celery + Redis + a **separate** nginx container | Laravel; the **backend image already runs nginx + php-fpm via supervisord on :80** — no extra nginx container, no Celery/Redis (`QUEUE=sync`, file cache/session) |
| `web` build needs `VITE_API_URL` | web uses relative `/api` — **no build-time API env needed** |
| JWT in localStorage | Sanctum Bearer tokens (same-origin via one CloudFront domain ⇒ no CORS) |
| Postgres | MySQL 8.4 (same image as local compose) |

### Deliberately NOT in this ticket (matches DrinkWise MVP cut-line)

RDS · ALB · ECS/Fargate · Multi-AZ · autoscaling · Redis · staging env · custom
domain · WAF · Terraform/IaC · CloudWatch alarms · OIDC federation. All deferred to
later phases (see Roadmap). `infra/` stays a placeholder; this ticket ships
config + workflows + a runbook, **not** Terraform.

## Scope of this change (what lands in the repo)

The actual AWS resources (account, EC2, S3, CloudFront, IAM, secrets) are created
**once, manually, in the AWS console** by the operator following the runbook below —
they require credentials, cost money, and are outward-facing, so they are not
automated here. What this PR adds to git:

1. **`docker-compose.prod.yml`** — prod stack: `mysql` (named volume, no published
   port, healthcheck, password from env) + `backend` (built locally on the host as
   `skillomat-backend:local`, `restart: unless-stopped`, host `:80`, prod env vars).
2. **`deploy/ec2-bootstrap.sh`** — EC2 user-data: install Docker + compose plugin,
   clone the repo to `/opt/skillomat`.
3. **`deploy/smoke-tests.sh`** — post-deploy checks against the CloudFront URL:
   frontend 200 + `/api/health` returns `{"status":"ok",...}`.
4. **`.github/workflows/deploy-web.yml`** — `push → main` on `web/**`: `npm ci` →
   `vite build` → `aws s3 sync dist/` → CloudFront invalidation → web smoke test.
5. **`.github/workflows/deploy-backend.yml`** — `push → main` on `backend/**` /
   `docker-compose.prod.yml`: AWS SSM `send-command` to the EC2 host →
   `git reset --hard origin/main` → `docker build` → `compose up -d` →
   `migrate --force` → host health curl → smoke test.
6. **`backend/.env.production.example`** — placeholder prod env template
   (no real secrets): `APP_ENV=production`, `APP_DEBUG=false`, fixed `APP_KEY`
   placeholder, MySQL creds, `APP_URL`/`APP_FRONTEND_URL=https://<id>.cloudfront.net`.
7. **Tiny edits:** `backend/docker/entrypoint.sh` — in production, skip the
   dev-only `cp .env.example .env` / `key:generate` when `APP_KEY` is supplied via
   the environment, and run `php artisan config:cache route:cache` once booted;
   `infra/README.md` + root `README.md` — point at this doc / drop the "deferred"
   wording for the now-shipped deploy path.

## Key technical decisions

- **Region `eu-central-1` (Frankfurt)** to match the operator's existing DrinkWise
  AWS footprint and keep data in the EU. *(Open question — confirm or override.)*
- **Backend deploy via SSM `send-command`** (not SSH): AL2023 ships the SSM agent;
  the EC2 instance gets `AmazonSSMManagedInstanceCore`, so CI needs no SSH key and
  the host needs no inbound `:22`. This is DrinkWise's landed approach.
- **`APP_KEY` is generated once during setup and lives in the host `.env`** — it is
  **never** regenerated on deploy (that would break encrypted cookies / password-reset
  tokens). Sanctum Bearer tokens are DB-hashed, so they survive regardless, but a
  stable key is still required.
- **Secrets stay out of git and out of the image:** the prod `.env` is placed on the
  host (`/opt/skillomat/.env`, gitignored, mode 600) and consumed via Compose
  variable substitution / `env_file`. Compose `environment:` overrides win over any
  baked `.env` because Laravel loads env immutably.
- **MySQL on the box** (Docker named volume on the EBS root) with **nightly EBS
  snapshots via a DLM policy** (7-day retention) for backup — no RDS in the MVP.
- **EC2 security group:** inbound `:80` only from the AWS-managed
  `com.amazonaws.global.cloudfront.origin-facing` prefix list; no `:22`; admin via
  SSM Session Manager. So the API is **not** reachable except through CloudFront.

## One-time manual AWS setup (operator runbook)

Performed once in the AWS console / CLI (`AWS_PROFILE`), ~half a day:

1. Region `eu-central-1`. Enable account-wide EBS default encryption.
2. EC2 `t3.small`, AL2023, 30 GiB gp3, IAM role `AmazonSSMManagedInstanceCore`,
   user-data = `deploy/ec2-bootstrap.sh`. Allocate + attach an Elastic IP.
3. Security group `skillomat-ec2-sg` per the rule above.
4. Place `/opt/skillomat/.env` on the host (from `backend/.env.production.example`):
   generate `APP_KEY` once (`php artisan key:generate --show`), set strong MySQL
   passwords, set `APP_URL`/`APP_FRONTEND_URL` to the CloudFront domain (filled in
   after step 6). Mode 600.
5. First boot: `cd /opt/skillomat && docker compose -f docker-compose.prod.yml up -d`.
6. S3 bucket `skillomat-web-prod` (private, SSE-S3). CloudFront distribution:
   origin 1 = S3 via OAC (default behavior, `CachingOptimized`); origin 2 = EC2
   Elastic IP HTTP:80 (`/api/*` behavior, `CachingDisabled`,
   `AllViewerExceptHostHeader`); viewer protocol redirect→HTTPS; SPA fallback
   `403/404 → /index.html` (200). Note the `*.cloudfront.net` domain → fill into the
   host `.env` and restart the backend.
6a. Google OAuth (MOB-13): once the CloudFront domain is known, create an OAuth
   2.0 client at https://console.cloud.google.com/apis/credentials with
   authorized redirect URI `https://<cloudfront-domain>/api/auth/google/callback`.
   Set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI` in the host
   `.env` and restart the backend — `docker-compose.prod.yml` passes these through
   to the container the same way it does `APP_URL`.
7. IAM CI user `skillomat-ci-deploy` (least privilege: S3 put/delete on the bucket,
   `cloudfront:CreateInvalidation`, `ssm:SendCommand`/`GetCommandInvocation`).
8. DLM policy: daily EBS snapshot, 7-day retention.
9. GitHub repo secrets (table below).

### GitHub secrets / vars

| Secret | Purpose |
| --- | --- |
| `AWS_DEPLOY_ACCESS_KEY` / `AWS_DEPLOY_SECRET_KEY` | CI IAM user (least privilege) |
| `EC2_INSTANCE_ID` | target for `ssm send-command` |
| `S3_BUCKET` | `skillomat-web-prod` |
| `CLOUDFRONT_DISTRIBUTION_ID` | invalidation target |
| `CLOUDFRONT_URL` | smoke-test base URL (`https://<id>.cloudfront.net`) |

## Out of scope

- Provisioning the AWS resources (done manually via the runbook, needs the
  operator's credentials and spends money).
- Custom domain / Route 53 / ACM, RDS, CloudWatch alarms, OIDC, staging — Roadmap.
- Any product/feature code change.

## Test plan (Step 7)

Because the deliverable is deploy config (not app logic), "functional tests" are
validation of the artifacts, runnable locally without AWS:

- `bash -n` (syntax) on `deploy/*.sh`; review for `set -euo pipefail` + quoting.
- `docker compose -f docker-compose.prod.yml config` parses and resolves cleanly.
- Workflow YAML parses (Python `yaml.safe_load`); job/step shape sanity-checked.
- **Local prod-stack bring-up** (Docker daemon started): `docker compose -f
  docker-compose.prod.yml up -d --build` with a throwaway local `.env`, then
  `curl localhost:80/api/health` → `{"status":"ok",...}`, and confirm
  `APP_DEBUG=false` / `APP_ENV=production` took effect and migrations ran. Tear down.
- `cd web && npm run build` succeeds and emits `dist/` (the artifact the web
  workflow uploads).
- `deploy/smoke-tests.sh` runs against the local prod stack (frontend may be skipped
  locally; `/api/health` check must pass).

CI (`.github/workflows/ci.yml`) continues to run Pint + PHPUnit + ESLint + Vitest on
the PR.
