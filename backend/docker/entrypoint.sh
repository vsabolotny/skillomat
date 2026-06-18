#!/bin/sh
set -e

cd /var/www/html

# In production all config is supplied via the environment (see
# docker-compose.prod.yml), including a pinned APP_KEY — skip the dev-only .env
# bootstrap so we never write a throwaway key or local defaults. Locally (no
# APP_KEY in the environment) keep the convenient first-boot flow.
if [ -z "${APP_KEY:-}" ]; then
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    if ! grep -q '^APP_KEY=base64:' .env; then
        php artisan key:generate --force
    fi
fi

# Wait for the database to accept connections.
DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
until php -r "exit(@fsockopen(getenv('DB_HOST') ?: 'mysql', (int) (getenv('DB_PORT') ?: 3306)) ? 0 : 1);"; do
    sleep 2
done
echo "MySQL is up."

# Apply migrations (proves write connectivity; no-op once applied).
php artisan migrate --force

# Refresh caches. In production, cache config + routes for performance (safe
# because every value comes from the environment); in dev, clear stale caches.
if [ "${APP_ENV:-local}" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
else
    php artisan config:clear
fi

exec "$@"
