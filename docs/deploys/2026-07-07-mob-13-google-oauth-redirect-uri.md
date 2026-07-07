# Deploy — MOB-13 Google OAuth redirect_uri fix

**Date:** 2026-07-07
**PR:** [#12](https://github.com/vsabolotny/skillomat/pull/12)
**Merge SHA on `main`:** `373c0e6`
**Triggered by:** push pipeline Step 9 (merge & deploy)

## Push summary

- PR: [#12](https://github.com/vsabolotny/skillomat/pull/12) — merged via merge-commit, branch deleted
- Target: `main`
- Commits: 1 fix commit (`fix(backend): pass Google OAuth env vars through to the prod container (MOB-13)`) + 1 follow-up KB commit (`docs(kb): update knowledge base after PR #12`)
- Docs updated: `backend/.env.production.example`, `documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md` (in PR), `documentation/kb/OPERATIONS.md` (post-merge), this deploy report
- Tests: 20 backend (PHPUnit) + 18 web (Vitest) passing, unaffected by this change; no new automated tests possible — this is a Docker Compose config fix with no app-code surface. Verified instead with `docker compose -f docker-compose.prod.yml config` (Google vars resolve when set, default to `""` when unset).
- Review: clean — code-review-expert found no P0/P1/P2/P3 findings.
- Merged SHA on `main`: `373c0e6`
- Deploys:
  - deploy-backend: ✅ ~1m4s — https://github.com/vsabolotny/skillomat/actions/runs/28841634986
  - deploy-web: not triggered (path filter excludes non-`web/**` changes)
- Independent post-deploy probe:
  - `GET https://d36dm25r2g88bf.cloudfront.net/api/health` → `{"status":"ok","database":"connected"}`
- Manual follow-up:
  - Register/confirm the Google Cloud Console OAuth client's authorized redirect URI as `https://d36dm25r2g88bf.cloudfront.net/api/auth/google/callback`.
  - Fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` into `/opt/skillomat/.env` on the EC2 host and restart the backend (`docker compose -f docker-compose.prod.yml up -d backend`) — ticket owner is doing this via SSH.
  - Click "Sign in with Google" on the live site afterward to confirm the fix end-to-end.

## What shipped

Fixes MOB-13 — Google sign-in failing in production with `Fehler 400: invalid_request — missing required parameter: redirect_uri`.

- `docker-compose.prod.yml` — added `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` to the `backend` service's `environment:` block (defaulting to empty), mirroring the existing `MAIL_*`/`AWS_*` passthrough pattern.
- `backend/.env.production.example` — un-commented the Google block so it's a real template entry instead of a skippable note.
- `documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md` — added a runbook step for registering the OAuth client in Google Cloud Console once the CloudFront domain is known.

No backend app code changed. No schema changes. No new runtime dependencies.

**Root cause:** `docker-compose.prod.yml` never declared the Google env vars in the `backend` service's `environment:` block. Docker Compose only forwards variables it explicitly lists — so even with correct values sitting in the host `/opt/skillomat/.env`, they never reached the container. Laravel Socialite then called Google's authorize endpoint with an empty `redirect_uri`, producing "missing required parameter" (distinct from `redirect_uri_mismatch`, which fires when the value is present but wrong).

## Deploy outcomes

| Workflow | Conclusion | Duration | Run |
| --- | --- | --- | --- |
| Deploy Backend | ✅ success | ~1m4s | [28841634986](https://github.com/vsabolotny/skillomat/actions/runs/28841634986) |
| CI (push on main) | ✅ success | — | triggered alongside the merge |
| Deploy Web | ⏭️ not triggered | — | path filter excludes non-`web/**` changes |

## Verification

- **Local gate before push:** backend PHPUnit (20/20) ✓, Pint ✓, web `tsc -b` ✓, ESLint ✓, Vitest (18/18) ✓.
- **Config verification:** `docker compose -f docker-compose.prod.yml config` confirmed the three Google vars interpolate correctly both when set and when left unset (empty-string default).
- **Secret scan:** clean — diff contains only placeholder/template values and `${VAR:-}` substitution syntax, no real credentials. GitGuardian PR check also passed.
- **Production:** `deploy-backend` finished green, its own smoke test (`curl /api/health` with retries) passed, and an independent post-deploy health probe confirmed the container came back up.

## Manual follow-up

- SSH to the EC2 host, fill the three `GOOGLE_*` vars in `/opt/skillomat/.env`, and run `docker compose -f docker-compose.prod.yml up -d backend` to pick them up (host `.env` edits aren't part of this deploy — the container was already restarted by `deploy-backend.yml`, but with empty Google vars until the host file is updated).
- Confirm/register the OAuth 2.0 client's authorized redirect URI in Google Cloud Console matches exactly: `https://d36dm25r2g88bf.cloudfront.net/api/auth/google/callback`.
- Click "Sign in with Google" on the live site to confirm the error is gone end-to-end.

## Likely failure modes

- **Redirect URI mismatch instead of missing-param:** if the host `.env` is filled in with a value that doesn't exactly match the Console-registered redirect URI (trailing slash, http vs https, wrong path), Google will instead reject with `redirect_uri_mismatch` — a different error than the one this PR fixes, but same user-facing "blocked" screen. Re-check the exact string on both sides.
- **Container not restarted after host `.env` edit:** Compose reads `.env` substitutions at `up` time, not continuously — a plain `docker compose restart backend` won't pick up new host `.env` values; needs `up -d backend`.
- **Multiple local checkouts:** not applicable here — no local-only reproduction path for this bug (it's production-config-specific).
