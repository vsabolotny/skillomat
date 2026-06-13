FROM php:8.4-fpm-alpine

# System packages and PHP extensions needed by Laravel + MySQL.
RUN apk add --no-cache nginx supervisor mysql-client \
    && docker-php-ext-install pdo_mysql \
    && rm -rf /var/cache/apk/*

# Composer (from the official image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP dependencies first for better layer caching.
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-interaction --prefer-dist --no-progress

# Application code.
COPY . .
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

# Runtime configuration.
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
