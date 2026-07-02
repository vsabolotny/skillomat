# Deploy — MOB-11 Landing Page

**Date:** 2026-07-02
**PR:** [#8](https://github.com/vsabolotny/skillomat/pull/8)
**Merge SHA on `main`:** `f3bfd1a96485b8c188920be5b1caf5661c474ecf`
**Triggered by:** push pipeline Step 9 (merge & deploy)

## Push summary

- PR: [#8](https://github.com/vsabolotny/skillomat/pull/8) — merged via merge-commit, branch deleted
- Target: `main`
- Commits: 1 feature commit (`feat(web): add marketing landing page (MOB-11)`) + 1 follow-up KB commit (`docs(kb): update knowledge base after PR #8`)
- Docs updated: README.md (in PR), documentation/kb/ARCHITECTURE.md + FEATURES.md (post-merge), new documentation/specs/2026-07-02-MOB-11-landing-page.md, this deploy report
- Tests: 13 passing (5 new in `LandingPage.test.tsx` + 8 existing); production build ✓
- Review: clean — code-review-expert found no P0/P1/P2; 3 P3 polish items fixed before push
- Merged SHA on `main`: `f3bfd1a`
- Deploys:
  - deploy-web: ✅ ~ run success — https://github.com/vsabolotny/skillomat/actions/runs/28620934647
  - deploy-backend: not triggered (path filter excludes non-`backend/**` changes)
  - CI (push job on main): ✅ success — run 28620934706
- Independent post-deploy probe:
  - `GET https://d36dm25r2g88bf.cloudfront.net/` → 200, `<title>Skillomat</title>`, new Google Fonts link present in shipped HTML
- Manual follow-up:
  - Visually confirm the live landing page (hero gradient, bento grid, nomad cards, mobile bottom nav <768px) once CloudFront cache warms.
  - Swap CSS gradient placeholders for real photography (follow-up ticket).
  - Wire the marketing nav (Search / My Offers / Messages / Profile) once those routes exist.

## What shipped

New marketing landing page at `/`, replacing the placeholder home route.

- `web/src/pages/LandingPage.tsx` (new, ~330 lines) — page composed of section components (top bar, hero, categories, how-it-works, trending nomads, CTA, footer, mobile bottom nav); auth-aware top bar via `useAuth`.
- `web/src/pages/LandingPage.css` (new) — design tokens as `.landing`-scoped CSS variables + all section styles; light theme only.
- `web/src/pages/LandingIcons.tsx` (new) — inline-SVG icon set (no icon-font dependency).
- `web/src/pages/landingContent.ts` (new) — static placeholder content (categories, steps, nomads, footer links).
- `web/src/pages/LandingPage.test.tsx` (new) — 5 render/behavior tests.
- `web/src/pages/auth.css` (renamed from `web/src/App.css`) — auth-page styles preserved after removing `App`.
- `web/src/components/HealthStatus.css` (new) — component-scoped health-badge styles moved out of `App.css`.
- `web/src/main.tsx` — route `/` → `LandingPage`; imports `pages/auth.css`; drops `App`.
- `web/src/index.css` — relaxed global `#root` (removed fixed 1126px width / centered text / side borders) to allow full-bleed sections.
- `web/index.html` — added Google Fonts (Montserrat + Inter) with preconnect.
- `web/src/App.tsx`, `web/src/App.css` — removed (obsolete).
- README.md — refreshed stale "initial setup" note + home-page description.

No backend changes. No schema changes. No new runtime dependencies (Google Fonts via CDN `<link>`; icons are inline SVG).

## Deploy outcomes

| Workflow | Conclusion | Duration | Run |
| --- | --- | --- | --- |
| Deploy Web | ✅ success | ~30s | [28620934647](https://github.com/vsabolotny/skillomat/actions/runs/28620934647) |
| CI (push on main) | ✅ success | — | [28620934706](https://github.com/vsabolotny/skillomat/actions/runs/28620934706) |
| Deploy Backend | ⏭️ not triggered | — | path filter excludes non-`backend/**` changes |

## Verification

- **Local gate before push:** `tsc -b` ✓, `eslint` ✓, `vitest run` ✓ (13 passed), `vite build` ✓.
- **Gate 2 (user):** landing page + auth-page regression check approved locally on the Vite dev server (`:5173`).
- **Production:** `deploy-web` finished green; `GET /` on CloudFront returned 200 with the new build markers (title + Google Fonts link).

Note: the local test baseline had been red due to local Node 22.9 being below the toolchain floor (rolldown native binding needs ≥22.12; jsdom needs unflagged `require(ESM)`). CI runs Node 24, so `main` was green there. Resolved by upgrading local Node to 26 — no repo workaround.

## Manual follow-up

- Open `https://d36dm25r2g88bf.cloudfront.net/` and click through: hero search, category grid, nomad cards' "View Profile", CTA buttons (→ `/register`), Sign in (→ `/login`).
- Check the mobile layout (<768px): single column + fixed bottom nav.
- Confirm Montserrat/Inter load (network tab) and there's no flash of unstyled text worth addressing.
- Verify the auth pages (`/login`, `/register`) still render correctly in production (App.css → auth.css relocation).

## Likely failure modes

- **CDN cache:** CloudFront may serve a stale `index.html`/asset until the invalidation from `deploy-web` propagates. Hard-refresh if the old placeholder home appears.
- **Google Fonts blocked:** if a client blocks `fonts.googleapis.com`, headings/body fall back to system fonts (Montserrat/Inter fallbacks declared) — layout stays intact.
- **Global `#root` change:** the relaxed `#root` affects every route; the risk surface is the auth pages. Covered by tests (behavior) + Gate 2 visual check, but worth a glance in prod.
- **Multiple local checkouts:** if a sibling clone runs a dev server on :5173/:5174, a local visual check could reflect the wrong build.
