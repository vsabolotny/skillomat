# MOB-11 — Landing Page

## Goal

Replace the current placeholder home route (a bare "Skillomat" heading + auth links + a
backend health indicator) with a full marketing landing page that sells the product:
a marketplace where nomads trade skills for money, goods, stays, or experiences. The page
follows the **Terracotta & Timber** design draft attached to the ticket (`DESIGN.md` +
`code.html` + `screen.png`).

## Design source

The draft is a Tailwind-CDN HTML mock. We translate it into the app's actual stack
(**React 19 + Vite + plain CSS**, no Tailwind) rather than adopting Tailwind. Design tokens
from `DESIGN.md` (colors, spacing, typography, radii) become CSS custom properties scoped to
the landing page.

## UX / behavior

Single scrolling page at `/`, light theme, max content width 1200px, full-bleed section
backgrounds. Sections top to bottom:

1. **Top app bar** — brand ("Skillomat" + pin mark), nav links, and an auth-aware action:
   - Logged out → "Sign in" (→ `/login`) and a primary "Get Started" (→ `/register`).
   - Logged in → "Signed in as **{name}**" + "Sign out" (reuses `useAuth`, preserving the
     behavior the current home page has today).
   - Marketing nav items (Search / My Offers / Messages / Profile) render but are visual-only
     placeholders — those routes don't exist yet.
2. **Hero** — headline "Exchange Skills, Explore the World.", supporting copy, and a
   two-field search bar (skill + location) with an "Explore" button. The search bar is
   presentational (no query wired yet).
3. **Top Skill Categories** — bento grid: Tech & Development (large), Permaculture, Creative
   Arts, Construction (wide).
4. **Experience the Journey** — three steps: Discover, Connect, Exchange.
5. **Trending Nomads** — three profile cards (Alex Rivera, Maya Chen, Marcus Thorne) with
   rating, location, skill chips, "looking for", and a "View Profile" affordance.
6. **CTA banner** — "Ready to start your next adventure?" with "Become a Nomad" (→ `/register`)
   and "List an Opportunity" (→ `/register`) buttons.
7. **Footer** — brand blurb, Community / About / Legal link columns, social icons, copyright.

Responsive: mobile-first single column that expands to the multi-column grids at ≥768px.
The draft's mobile bottom-nav bar is included as a visual element on small screens.

## Technical approach

**New files**
- `web/src/pages/LandingPage.tsx` — the page, composed of small internal section components
  (`TopBar`, `Hero`, `Categories`, `HowItWorks`, `TrendingNomads`, `CtaBanner`, `SiteFooter`).
- `web/src/pages/landingContent.ts` — static content arrays (categories, steps, nomads,
  footer links) mapped in the view. Keeps JSX declarative.
- `web/src/pages/LandingPage.css` — design tokens as CSS variables + all section styles,
  scoped under a `.landing` root so global dark-mode / `#root` rules don't leak in.
- `web/src/pages/LandingPage.test.tsx` — functional render tests.
- `web/src/pages/auth.css` — relocated auth styles (see "CSS ownership" below).

**Changed files**
- `web/src/main.tsx` — route `/` renders `<LandingPage />` instead of `<App />`.
- `web/index.html` — add the Google Fonts `<link>` for Montserrat + Inter.

**Removed files**
- `web/src/App.tsx` and `web/src/App.css` — obsolete once the home route moves. (See below.)

**Icons** — a small set of inline SVG icons (pin, search, map, laptop, leaf, brush,
architecture, handshake, check, star, chevron, arrow, globe, camera, mail). No icon-font
runtime dependency; renders in jsdom for tests. (Draft used the Material Symbols font.)

**Typography** — Montserrat (headings) + Inter (body) via a Google Fonts `<link>` in
`index.html`, matching the design. Graceful fallback to system fonts.

**Images** — the draft's `lh3.googleusercontent.com/aida-public/...` URLs are ephemeral
AI-generated links that will rot; we do **not** hardcode them. Hero and card imagery use
tasteful CSS gradient/tonal placeholders in the brand palette, with correct `alt`/aria
semantics and a structure that lets real photography drop in later. Real imagery is a
follow-up, not part of this ticket.

**Content** — categories, steps, and nomad cards are static placeholder data. Not wired to
the backend.

### CSS ownership (regression-sensitive)

`App.css` currently holds the `.auth-*` styles that the login/register/forgot/reset pages
depend on, and it only reaches the bundle because `main.tsx` imports `App`. Removing `App`
would silently un-style the auth pages. To avoid that:

- Move the `.auth-*` rules into `web/src/pages/auth.css`, imported once in `main.tsx`.
- Drop the obsolete `.app`, `.tagline`, `.account*`, and `.health` rules (old home + the
  health indicator, which the design doesn't include).

`index.css` `#root` currently forces `width: 1126px; text-align: center; border-inline`,
which fights a full-bleed landing page. Relax `#root` to a full-width flex column (drop the
fixed width, centered text, and side borders). Auth pages are unaffected because `.auth-card`
centers itself via `max-width` + `margin: auto`; verified manually in Step 8.

## Out of scope

- Real photography (CSS placeholders used).
- Wiring Search / Messages / Profile / My Offers nav to real pages.
- Backend-driven categories / nomads (static mock content).
- Dark mode for the landing page (light theme only, matching the screenshot).
- Full Tailwind adoption.
- i18n / localization.

## Open questions

1. **Brand name** — the draft says "NomadSkills" everywhere; the product is **Skillomat**.
   Plan uses **Skillomat**. OK?
2. **Backend health indicator** — currently shown on the home page for ops visibility; the
   design has no place for it. Plan **drops it from the landing page** (component file kept
   for reuse elsewhere). OK?
3. **Icons** — plan uses **inline SVGs** (self-contained, testable) rather than the Material
   Symbols web font the draft used. OK?

## Prerequisite: repair the test baseline

The vitest suite is **red on `main`** (pre-existing, unrelated to MOB-11): the jsdom
environment pulls `html-encoding-sniffer@6`, which CommonJS-`require`s the now ESM-only
`@exodus/bytes`, throwing `ERR_REQUIRE_ESM` before any test loads. The mandatory landing-page
render test can't run until this is fixed. Plan: add a minimal, verified fix (an npm
`overrides` pin of `html-encoding-sniffer` to its last CJS release, or switch the test env to
`happy-dom`) to `web/package.json`, confirm the existing 5 suites go green, **then** build the
feature on a working baseline.

## Test plan

`web/src/pages/LandingPage.test.tsx` (testing-library + MemoryRouter + AuthProvider, matching
existing page-test conventions):

- Renders the hero headline and supporting copy.
- Renders every section heading (Top Skill Categories, Experience the Journey, Trending
  Nomads, and the CTA).
- Renders all three trending nomads by name.
- Logged out: "Get Started" links to `/register` and "Sign in" links to `/login`.
- Logged in (seeded token + mocked `/api/me`): shows the user's name and a "Sign out" control
  — the auth behavior preserved from the old home page.

Plus: the full suite (`npm run test`) must pass on the repaired baseline.
