# infra

Infrastructure-as-code for Skillomat.

**Status: placeholder.** Local development runs entirely through the root
[`docker-compose.yml`](../docker-compose.yml) — there is no cloud infrastructure
in this ticket (MOB-1).

## Planned (later tickets)

- **AWS** provisioning via Terraform (VPC, RDS for MySQL, ECS/Fargate or EC2 for
  the Laravel backend, S3 + CloudFront for the React web build).
- CloudFront distribution and, later, a custom domain.
- CI/CD wiring to deploy from GitHub.

When that work starts, Terraform modules live here (e.g. `infra/terraform/`).
