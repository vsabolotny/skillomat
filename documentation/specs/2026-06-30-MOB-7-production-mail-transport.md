# MOB-7 — Production mail transport for transactional email

## Goal

Transactional email (today only the MOB-2 password-reset link) must actually be
delivered in production. Local dev uses the `log` mail driver, so reset emails are
written to `storage/logs` instead of being sent. This wires up **AWS SES** as the
production transport, passes the needed config into the prod container, and documents
the one-time SES provisioning that has to happen in AWS (which is not yet set up).

## Decisions (confirmed)

- **Transport: AWS SES** (`ses` mailer) — native to the existing EC2/S3/CloudFront/IAM
  stack; `config/services.php` already wires the `ses` block to `AWS_*` env.
- **Auth: IAM instance role (target), static keys (fallback).** The AWS SDK's default
  credential chain auto-discovers credentials from EC2 instance metadata when
  `AWS_ACCESS_KEY_ID`/`_SECRET_ACCESS_KEY` are unset — so the preferred path stores
  **no mail secret anywhere**. A dedicated SES IAM user with static keys in the host
  `/opt/skillomat/.env` is documented as a fallback.
- AWS/SES is **not provisioned yet**, so this ticket delivers the code + config + a
  runbook. The actual SES setup (verify identity, DKIM/SPF, sandbox exit, IAM policy)
  is a manual operator task captured in the runbook below.

## UX / behavior

No user-facing UI change. Behavioral change: with `MAIL_MAILER=ses` set on the host,
a "forgot password" request sends a real email through SES instead of logging it. The
reset link still points at the SPA `/reset-password` route (unchanged from MOB-2).

## Technical approach

1. **Add the SES driver dependency** — `composer require aws/aws-sdk-php`. Laravel's
   `ses` transport needs the AWS SDK; it is currently absent (`vendor/aws` missing),
   so `MAIL_MAILER=ses` would fail today. Runtime dependency (not `--dev`).
2. **`config/mail.php`** — no change needed; `ses` mailer and `from` block already exist.
   `config/services.php` `ses` block already reads `AWS_ACCESS_KEY_ID/SECRET/REGION`.
3. **`docker-compose.prod.yml`** — the backend `environment:` block currently passes no
   mail/AWS vars, so host `.env` values never reach the container. Add:
   - `MAIL_MAILER: ${MAIL_MAILER:-log}` (safe default; set `ses` in host `.env` to deliver)
   - `MAIL_FROM_ADDRESS: ${MAIL_FROM_ADDRESS:-hello@example.com}`
   - `MAIL_FROM_NAME: ${MAIL_FROM_NAME:-Skillomat}`
   - `AWS_DEFAULT_REGION: ${AWS_DEFAULT_REGION:-us-east-1}` (SES region)
   - `AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:-}` / `AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:-}`
     — empty by default so the SDK falls back to the instance role; populated only on the
     static-key fallback path.
4. **`backend/.env.production.example`** — replace the commented mail stub with a real
   SES section (placeholders only, no live values) + a pointer to the runbook.
5. **`backend/.env.example`** — keep local dev on `log`; add a one-line comment pointing
   to the SES setup for production.
6. **Runbook** — `documentation/kb/OPERATIONS.md` gets an "Email (SES)" subsection: verify
   a sender identity, enable DKIM (3 CNAMEs) + SPF, request production access (sandbox
   exit), attach an `ses:SendEmail`/`SendRawEmail` IAM policy to the instance role, and
   the `php artisan tinker` smoke command to confirm end-to-end delivery.

## Out of scope

- Provisioning the actual AWS account / SES (no AWS yet) — operator task per the runbook.
- A custom domain (none yet); MVP verifies a single sender email identity in SES.
- Marketing email, queue/retry tuning beyond Laravel defaults (per ticket).
- Changing the reset-email content or the SPA reset flow (MOB-2, unchanged).

## Test plan (CI — runs without real SES)

1. `test_ses_mailer_resolves` — `Mail::mailer('ses')` builds without throwing. This is
   the regression guard for the #1 SES footgun: a missing `aws/aws-sdk-php` dependency.
   Fails today (no SDK), passes after step 1.
2. `test_password_reset_notification_links_to_spa_with_token` — render the
   `ResetPasswordNotification` mail and assert the action URL is the configured
   frontend `/reset-password` URL carrying the token + email. Upgrades the existing
   weak `is_subclass_of` assertion into a real behavioral check.
3. Existing 19 tests stay green.

## Manual verification (operator, once SES exists)

`php artisan tinker` → `Password::sendResetLink(['email' => '<verified-addr>'])` → confirm
the email arrives in the inbox with working SPF/DKIM (no spam folder).
