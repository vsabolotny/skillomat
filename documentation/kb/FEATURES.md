# Features

<!-- Last updated: 2026-06-30 (PR #7) -->

## Live features

| Feature              | PR  | Key files                                                                                  | Notes                                                                 |
| -------------------- | --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Health check API     | #1 (MOB-1) | `backend/routes/api.php`, `backend/app/Http/Controllers/HealthController.php`        | `GET /api/health` pings MySQL; returns status + DB connectivity      |
| Web health status    | #1 (MOB-1) | `web/src/App.tsx`, `web/src/components/HealthStatus.tsx`                             | Landing page shows a green/red badge for backend+DB reachability     |
| Local Docker stack   | #1 (MOB-1) | `docker-compose.yml`, `backend/Dockerfile`, `web/Dockerfile`                         | `docker compose up` boots mysql + backend + web, wired together      |
| User accounts & auth | #3 (MOB-2), #7 (MOB-7) | `backend/routes/api.php`, `backend/app/Http/Controllers/Auth/*`, `backend/app/Notifications/ResetPasswordNotification.php` | Google SSO + email/password login & password recovery; reset email delivers via AWS SES in prod (pending SES provisioning — see OPERATIONS.md) |

## Planned / in progress

| Feature                         | Status   | Notes                                                        |
| ------------------------------- | -------- | ----------------------------------------------------------- |
| Skill listings                  | Planned  | What a traveler can do; the core marketplace object         |
| Hire / barter transactions      | Planned  | Money or trade for goods, stays, experiences                |
| Search & discovery              | Planned  | Find skills by location/category                            |
| React Native mobile app         | Planned  | `app/` — primary client per product vision                  |
| AWS deployment (CloudFront)     | Planned  | `infra/` — Terraform; RDS, ECS/Fargate, S3 + CloudFront     |
