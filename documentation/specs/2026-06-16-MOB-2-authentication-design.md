# Skillomat — Authentication (MOB-2)

**Ticket:** [MOB-2](https://vladworkinghard.atlassian.net/browse/MOB-2) — "Authentication"

**Status:** Draft / awaiting plan approval (Gate 1)

## Goal

Let people create an account and sign in to Skillomat. Two sign-in paths the
ticket asks for:

1. **Google Account SSO** — one-click sign-in/up with a Google account.
2. **Email + password** — classic credentials, **plus password recovery** (forgot
   → email reset link → set new password).

This is the first product feature on top of the MOB-1 skeleton; there is no auth
code yet (stock Laravel `User` + the default `users` / `password_reset_tokens`
migrations, and a router-less Vite SPA).

## UX / behavior

Web SPA gains real routing (currently single page). New routes:

| Route | Page | Behavior |
| --- | --- | --- |
| `/login` | Login | Email+password form; "Sign in with Google" button; links to register & forgot-password. |
| `/register` | Register | Name, email, password (+confirm); on success the user is signed in. |
| `/forgot-password` | Forgot password | Email field → "we've sent you a reset link" (always, no account enumeration). |
| `/reset-password` | Reset password | Reached from the emailed link (`?token=…&email=…`); new password + confirm. |
| `/auth/google/callback` | Google return | Reads the issued token from the URL, stores it, redirects to home. |
| `/` | Home | Existing landing page; shows the signed-in user's name + "Sign out" when authenticated. |

Errors surface inline (invalid credentials, validation messages, expired reset
token). Login and forgot-password are rate-limited.

## Technical approach

### Auth mechanism — Sanctum **API tokens** (Bearer)

Install `laravel/sanctum`. Use **token-based** auth (not cookie/SPA mode):

- Login/register return a plaintext token (`$user->createToken()`); the SPA stores
  it and sends `Authorization: Bearer <token>`.
- Protected routes use the `auth:sanctum` guard.
- **Why tokens over cookie/SPA mode:** the product is mobile-first ("MOB", React
  Native is a planned ticket). A bearer-token API is identical for web and a future
  native client, with no CSRF/stateful-domain coupling. Trade-off: the token lives
  in JS-reachable storage (XSS exposure) rather than an httpOnly cookie — acceptable
  for an MVP and the conventional Sanctum-SPA-token choice. Revisit if we add
  first-party web-only sessions later.

### Backend

- `composer require laravel/sanctum laravel/socialite`; publish Sanctum config +
  the `personal_access_tokens` migration.
- **Migration** `add_auth_columns_to_users`: `google_id` (string, nullable, unique);
  make `password` **nullable** (Google-only users have no password).
- **`User` model**: add `HasApiTokens`; add `google_id` to the fillable attributes.
- **`config/services.php`**: `google` block reading `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` from env. `.env.example` gets
  placeholder keys only — **no real credentials committed**.
- **Routes** (`routes/api.php`), all under `/api/auth`:
  - `POST /register`, `POST /login` — public, throttled.
  - `POST /logout`, `GET /me` — `auth:sanctum`.
  - `POST /forgot-password`, `POST /reset-password` — public, throttled.
  - `GET /google/redirect`, `GET /google/callback` — Socialite (stateless).
- **Controllers** (thin, one responsibility each): `RegisteredUserController`,
  `AuthenticatedSessionController` (login/logout/me), `PasswordResetLinkController`
  (forgot), `NewPasswordController` (reset), `GoogleController` (redirect/callback).
- **Form requests** for validation (register/login/forgot/reset).
- **Password recovery** uses Laravel's built-in password broker
  (`Password::sendResetLink` / `Password::reset`). A custom `ResetPassword`
  notification points the link at the SPA's `/reset-password` route (via
  `APP_FRONTEND_URL`). **Locally `MAIL_MAILER=log`** writes the reset URL to
  `storage/logs` — no mail server needed; production mail is a later ticket
  (MOB-1 deferred mail/queues).
- **Google callback** finds-or-creates the user by `google_id`/email, issues a
  Sanctum token, and redirects to `APP_FRONTEND_URL/auth/google/callback#token=…`.

### Web

- `npm i react-router-dom`. Introduce a `BrowserRouter` in `main.tsx`.
- **`AuthContext` + `useAuth`**: holds the token (persisted in `localStorage`) and
  the current user; exposes `login`, `register`, `logout`, `loginWithGoogle`.
- **`api.ts`** fetch helper: prefixes `/api`, attaches the bearer token, parses
  Laravel validation errors (422) into a usable shape.
- **Pages**: `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`,
  `GoogleCallbackPage`. Plain controlled forms, no UI library.
- Home shows the signed-in user + sign-out; unauthenticated state shows links to
  log in / register.

## Out of scope (explicit)

- Email *verification* (the ticket asks for sign-in, not verification).
- Production mail transport (SES/SMTP) — local `log` mailer only; deferred ticket.
- Profile management, avatars, roles/permissions, account deletion.
- Refresh-token rotation / token expiry tuning (Sanctum defaults).
- Other social providers (Apple, Facebook).
- Real marketplace domain (listings, bookings) — separate tickets.

## Open questions (decide at Gate 1)

1. **Token vs cookie auth** — proposing Sanctum bearer tokens (mobile-friendly).
   OK, or do you want httpOnly-cookie SPA sessions for the web client?
2. **Scope of this PR** — the ticket bundles three things. Proposing **all of it in
   one PR** (it's cohesive). Alternative: land email/password + recovery first, and
   Google SSO as a fast-follow PR on the same ticket. Your call.
3. **Google OAuth credentials** — I'll wire the code + `.env.example` placeholders.
   You'll need to create a Google OAuth client and drop real values into your local
   `.env` to exercise the live Google flow (tests mock Socialite, so they pass
   without it). Confirm that's fine.

## Test plan (ships with the change — Step 7)

**Backend (PHPUnit feature tests, in-memory SQLite):**

- Register: creates user, returns token; rejects duplicate email & weak/missing
  fields (422).
- Login: valid creds return a token; wrong password / unknown email → 401/422; no
  account enumeration.
- `me` / `logout`: require a valid token; logout revokes it.
- Forgot password: `Notification::fake()` asserts the reset notification is sent to
  a known email; unknown email still returns 200 (no enumeration).
- Reset password: valid token sets the new password (can then log in); invalid/expired
  token rejected.
- Google callback: `Socialite::shouldReceive()` mock returns a fake Google user →
  creates the account, issues a token; a second callback for the same Google id logs
  the existing user in (no duplicate).

**Web (Vitest + RTL, fetch mocked):**

- Login form: submits credentials, stores token, reflects authenticated state;
  shows an inline error on 401.
- Register form: validation error display on 422.
- Forgot-password form: success confirmation message.
- `AuthContext`: hydrates from `localStorage`, clears on logout.
