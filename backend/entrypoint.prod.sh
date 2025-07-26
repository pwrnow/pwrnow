#!/bin/sh

# Exit on error
set -e

# Apply database migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn
exec gunicorn config.wsgi --bind 0.0.0.0:5000 --chdir=/app