# infra

Infrastructure-as-code for Skillomat.

Local development runs entirely through the root
[`docker-compose.yml`](../docker-compose.yml).

## Production (MOB-3) — single EC2 host + S3/CloudFront

The first public deployment is **not** Terraform — it is a lean, manually
provisioned MVP: one EC2 host runs the Laravel API + MySQL via
[`docker-compose.prod.yml`](../docker-compose.prod.yml), the React build lives in S3,
and a single CloudFront distribution fronts both (`default → S3`, `/api/* → EC2`).
Deploys are driven by the `deploy-web` / `deploy-backend` GitHub Actions workflows.

Full architecture, the one-time AWS console runbook, and the GitHub secrets list:
[`documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md`](../documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md).

The host-side config lives in [`deploy/`](../deploy) (`ec2-bootstrap.sh`,
`smoke-tests.sh`).

## Planned (later tickets)

- Terraform/IaC for the resources currently created by hand.
- RDS for MySQL, ALB/ECS as the host outgrows a single box, a custom domain
  (Route 53 + ACM), and CloudWatch alarms.
