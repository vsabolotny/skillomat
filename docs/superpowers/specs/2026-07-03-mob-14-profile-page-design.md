# MOB-14 — User Profile Page

**Ticket:** [MOB-14 "Create Profile Page"](https://vladworkinghard.atlassian.net/browse/MOB-14)
**Design source:** Stitch project *Nomad Skill Exchange* — screen "NomadSkills – User Profile" (mobile + desktop).
**Date:** 2026-07-03

## Goal

Add a `/profile` page to the `web/` React app that renders the user profile screen from
the Stitch design, built in the existing app's idiom (hand-written scoped CSS + inline-SVG
icons + static content module) rather than the Stitch export's Tailwind-CDN approach.

## Context

The Stitch export (`code.html`) uses Tailwind CDN + the Material Symbols icon font. The
existing app deliberately does **not**: `LandingPage` uses hand-written CSS with tokens
from the same "Terracotta & Timber" spec, scoped under a root class to avoid leaking into
the app's global reset/dark-mode rules, a custom inline-SVG `<Icon>` component, and static
demo data in a `landingContent.ts` module. The profile page mirrors that structure so the
codebase stays consistent and dependency-free.

No profile/user API exists yet, so all content is static demo data (Elena Rodriguez), exactly
matching the design. Wiring to auth/backend is explicitly out of scope (YAGNI).

## Files

| File | Purpose |
|------|---------|
| `web/src/pages/ProfilePage.tsx` | Page component: `TopBar`, `ProfileHero`, `VerifiedSkills`, `ActiveOffers`, `StatsGrid`, `BottomNav` |
| `web/src/pages/ProfilePage.css` | Scoped `.profile` tokens + rules, mirroring `LandingPage.css` (light-theme only) |
| `web/src/pages/profileContent.ts` | Static data: profile summary, skills, offers, stats |
| `web/src/pages/ProfilePage.test.tsx` | Render/content tests, matching the per-page test pattern |
| `web/src/pages/LandingIcons.tsx` | Extend `IconName` union + `PATHS` with new icons |
| `web/src/main.tsx` | Add `<Route path="/profile" element={<ProfilePage />} />` |

## Sections (top → bottom, per design)

1. **Fixed top app bar** — location-pin mark + "Skillomat" wordmark (brand consistent with
   landing, which renames NomadSkills → Skillomat); `settings` + `bell` (notifications) icon buttons.
2. **Profile hero card** — cover media (CSS gradient placeholder w/ descriptive `aria-label`,
   matching landing's media treatment), name "Elena Rodriguez", subtitle "Digital nomad & baker",
   a stats strip (Trades `42`, Rating ★ `4.9`), and a primary **Edit Profile** button.
3. **Verified Skills** — heading + `verified` badge; pill chips (Artisan Sourdough, UI Design,
   Spanish (Native), Photography) each with a leading icon, using the secondary-container tint.
4. **Active Offers** — heading + "View all"; list of 2 offer cards (thumbnail placeholder, title,
   location line, "Trading" tag, "Active" status).
5. **Stats bento** — 2-up grid: `12` Active Trades (history icon), `158` Saved by others (heart icon).
6. **Bottom nav** — Search / My Offers / Messages / Profile, with **Profile** active.

## Decisions

- **Layout:** mobile-first matching the mobile design, plus a desktop breakpoint (≥1024px)
  that widens the content column and lays hero + side content out per the desktop Profile
  screen. Consistent with LandingPage being fully responsive.
- **Media:** CSS gradient / placeholder blocks with `aria-label`, no external image hosts
  (matches LandingPage; the Stitch googleusercontent URLs are avoided as they may expire).
- **Icons:** reuse existing (`pin`, `verified`, `star`, `handyman`, `chat`, `person`,
  `search`, `camera`); add `settings`, `bell`, `edit`, `translate`, `history`, `heart`,
  `bakery` as inline SVG paths.
- **Styling:** scoped under `.profile` with its own `--p-*` token block (same values as the
  landing tokens), so global dark-mode rules don't leak — identical rationale to LandingPage.
- **Content module:** `profileContent.ts` exports typed arrays for skills, offers, and stats.

## Testing

`ProfilePage.test.tsx` renders the page inside a `MemoryRouter` and asserts: name + subtitle
present, all four skill chips render, both offers render with their titles, the two stat
figures (12, 158) render, and the Profile bottom-nav item is marked active. Mirrors the
existing `LandingPage.test.tsx` approach.

## Out of scope

- Live profile/user data, editing behaviour (the Edit Profile button is a static control).
- Dark mode (the design and LandingPage are light-only).
- Auth-gating the route.
