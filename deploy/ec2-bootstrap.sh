#!/bin/bash
# EC2 user-data for the Skillomat production host (MOB-3).
#
# Paste this as the user-data when launching the t3.small (Amazon Linux 2023).
# It installs Docker + the Compose plugin and clones the repo to /opt/skillomat.
# The first `docker compose up` and the host .env are placed by the operator
# afterwards (see documentation/specs/2026-06-18-MOB-3-aws-cloudfront-deploy.md);
# subsequent deploys are driven by the deploy-backend.yml workflow over SSM.
set -euxo pipefail

APP_DIR=/opt/skillomat
REPO_URL=https://github.com/vsabolotny/skillomat.git

dnf update -y
dnf install -y docker git
systemctl enable --now docker

# Compose v2 as a CLI plugin (AL2023 has no compose package).
mkdir -p /usr/libexec/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Clone the repo (public over HTTPS). For a private repo, configure a deploy key
# or a fine-grained token before this step.
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

echo "Bootstrap complete. Next (operator, one time):"
echo "  1. Place ${APP_DIR}/.env from backend/.env.production.example (chmod 600)."
echo "  2. cd ${APP_DIR} && docker compose -f docker-compose.prod.yml up -d --build"
