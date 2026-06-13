#!/bin/sh
set -e

cd /var/www/html

# Ensure an environment file exists.
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Generate the application key on first boot.
if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
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

# Refresh caches.
php artisan config:clear

exec "$@"
