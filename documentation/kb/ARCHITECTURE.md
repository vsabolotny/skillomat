# Architecture

<!-- Last updated: 2026-07-02 (PR #8) -->

Skillomat is a marketplace where travelers offer their skills for money, goods,
stays, or experiences. This document describes the **current** state of the
codebase, which is the initial setup (MOB-1) — a monorepo foundation with runnable
backend and web skeletons. No marketplace domain logic exists yet.

## Monorepo layout

| Path        | Stack                              | Purpose                                  |
| ----------- | ---------------------------------- | ---------------------------------------- |
| `backend/`  | PHP 8.4, Laravel 13                | HTTP API, served by nginx + php-fpm      |
| `web/`      | React 19, Vite, TypeScript         | Single-page app that consumes the API    |
| `infra/`    | (placeholder)                      | AWS IaC, deferred to a later ticket      |
| `documentation/` | Markdown                      | Specs (`documentation/specs/`) and KB (`documentation/kb/`) |

The mobile app (React Native) and cloud deployment (AWS/CloudFront) are not yet
in the repo.

## Backend (Laravel)

- **Entry / routing:** `backend/bootstrap/app.php` registers `routes/web.php`,
  `routes/api.php` (prefix `/api`), and `routes/console.php`. JSON error rendering
  is enabled for `api/*` paths.
- **Controllers:** `backend/app/Http/Controllers/`.
- **Models:** only the default Laravel `User` model exists
  (`backend/app/Models/User.php`). No marketplace models yet.
- **Migrations:** Laravel defaults only (`users`, `cache`, `jobs` tables under
  `backend/database/migrations/`). Run on container start by the entrypoint.

### API routes

| Method | Path          | Controller                  | Description                                   |
| ------ | ------------- | --------------------------- | --------------------------------------------- |
| GET    | `/api/health` | `HealthController@show`     | Pings MySQL; returns status + DB connectivity |
| GET    | `/up`         | (framework health)          | Laravel's built-in health route               |
| GET    | `/`           | closure → `welcome` view    | Default Laravel welcome page (scaffold)        |

`GET /api/health` returns `{"status":"ok","database":"connected"}` (HTTP 200) when
MySQL responds to `SELECT 1`, or `{"status":"degraded","database":"unreachable"}`
(HTTP 503) when it does not.

## Web (React + Vite)

- **Entry:** `web/src/main.tsx` — `BrowserRouter` + `AuthProvider` wrap the routes.
- **Routes / pages** (`web/src/pages/`):
  - `/` → `LandingPage.tsx` — marketing landing page (hero, skill-category bento,
    how-it-works, trending nomads, CTA, footer, mobile bottom nav). Built in plain
    CSS (`LandingPage.css`, design tokens as scoped variables) with inline-SVG
    icons (`LandingIcons.tsx`) and static content (`landingContent.ts`). The top
    bar is auth-aware via `useAuth`. Signed-out CTAs point to `/register` / `/login`.
  - `/login`, `/register`, `/forgot-password`, `/reset-password`,
    `/auth/google/callback` — auth pages; shared styles in `pages/auth.css`.
- **Components:** `web/src/components/HealthStatus.tsx` fetches `/api/health` on
  mount and renders a status badge (`loading` / `connected` / `unreachable`),
  styled by `HealthStatus.css`. It is a reusable component, no longer mounted on
  the home route.
- **API access:** Vite dev server proxies `/api/*` to the backend
  (`VITE_API_PROXY`, default `http://localhost:8080`). See `web/vite.config.ts`.

## Data flow (current)

```
Browser ──> web (Vite SPA, :5174 in Docker / :5173 local)
              │  fetch('/api/health')  [proxied]
              ▼
           backend (Laravel via nginx + php-fpm, :8080)
              │  SELECT 1
              ▼
           mysql (:3306)
```

This single flow is the end-to-end proof that the three services are wired
together. Everything else is scaffolding to be built on in later tickets.
