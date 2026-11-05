FROM php:8.4-cli

# pcntl provides the signal constants required by Reverb.
# PostgreSQL is used by Docker; SQLite keeps the feature test suite runnable.
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libsqlite3-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql pdo_sqlite pcntl

# Installation de Composer (le gestionnaire de paquets PHP)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Commande par défaut pour lancer le serveur de dev Laravel
CMD composer install && php artisan serve --host=0.0.0.0 --port=8000