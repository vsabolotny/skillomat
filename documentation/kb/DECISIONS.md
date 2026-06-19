# Decisions

<!-- Last updated: 2026-06-18 (PR #5) -->

Architectural decisions, newest at the bottom.

## Monorepo with separate backend/web/infra (MOB-1)

Context: Skillomat spans a PHP API, a React web client, a future React Native app,
and AWS infra.
Why: keeping all surfaces in one repo simplifies coordinated changes and a single
Docker-based local environment, while clear top-level folders keep the stacks
isolated.
Impact: each subsystem (backend, web, app, infra) is built and tested
independently; one ticket per subsystem feature.

## PHP 8.4 (MOB-1)

Context: the ticket specified "PHP 8.3".
Why: Laravel 13 requires PHP ≥ 8.4.1, so 8.3 cannot run it. Bumping PHP is the
correct fix rather than downgrading the framework.
Impact: `backend/Dockerfile` uses `php:8.4-fpm-alpine`; `composer.json` requires
`^8.4`; CI installs PHP 8.4.

## Vite React SPA over a SSR framework (MOB-1)

Context: the web client needs to consume a separate Laravel API and will be hosted
on S3 + CloudFront later.
Why: a static SPA deploys cleanly to CloudFront and keeps a hard separation (PHP
owns data, React owns UI). SSR (Next.js) would add a Node server to run and deploy.
Impact: `web/` is a Vite + React + TypeScript SPA. If public-listing SEO becomes a
priority, SSR can be revisited as its own ticket.

## Single backend container runs nginx + php-fpm (MOB-1)

Context: Laravel needs a web server in front of php-fpm.
Why: keeping both in one `backend` service (via supervisord) matches the "one
backend service" model and keeps `docker-compose.yml` to three services.
Impact: `backend/docker/{nginx.conf,supervisord.conf,entrypoint.sh}` define the
runtime; the entrypoint waits for MySQL, generates the app key, and migrates.

## Web published on host port 5174 in Docker (MOB-1)

Context: port 5173 (Vite's default) is frequently occupied by other local dev
servers on this machine.
Why: avoid colliding with sibling projects' dev servers.
Impact: `docker-compose.yml` maps `5174:5173` and sets `VITE_HMR_CLIENT_PORT=5174`;
plain `npm run dev` (no Docker) still uses the standard 5173.

## Tests run against in-memory SQLite (MOB-1)

Context: feature tests need a database.
Why: Laravel's default in-memory SQLite is fast and zero-setup; the health test's
`SELECT 1` is database-agnostic, so it validates the endpoint without a MySQL
service in CI.
Impact: `backend/phpunit.xml` sets `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`.
No app encryption key is committed — tests that needed one (the default scaffold
`ExampleTest`) were removed.

## Greenfield bootstrap: seed main, then PR (MOB-1)

Context: the repository had zero commits, so there was no `main` to branch from or
PR into.
Why: preserve the feature-branch + PR review flow even for the first ticket.
Impact: `main` was seeded with an empty root commit; the scaffold landed via PR #1.
All subsequent work uses the standard `feature/<TICKET>-<slug>` → PR flow.

## Single CloudFront distribution fronts both tiers (MOB-3)

Context: the app must be public at a `*.cloudfront.net` URL (no domain yet); the SPA
calls the API at the relative path `/api` and uses Sanctum Bearer tokens.
Why: putting web (S3) and API (EC2) behind **one** CloudFront domain
(`default → S3`, `/api/* → EC2`) keeps the SPA's API calls same-origin, so there is
no CORS/CSRF setup and nothing to reconfigure when the CloudFront domain is created.
Impact: `docker-compose.prod.yml` + two GitHub Actions deploy workflows; the EC2
security group allows `:80` only from the CloudFront prefix list.

## Lean single-EC2 AWS MVP, provisioned manually (MOB-3)

Context: first production deploy on a tight budget, no custom domain.
Why: one `t3.small` running `docker compose` (backend + MySQL) plus S3/CloudFront is
~€30/mo and ships in a day; RDS/ALB/ECS/Terraform are deferred until the single host
is outgrown. Backend deploys use AWS SSM `send-command` (keyless — no SSH key in CI,
no inbound `:22`); the image builds with daemon-integrated BuildKit
(`DOCKER_BUILDKIT=1 docker build`) because AL2023 lacks the buildx plugin that
`compose build` requires.
Impact: AWS resources are created by hand per the MOB-3 runbook (not IaC); `APP_KEY`
is pinned in the host `.env` and never regenerated on deploy.
