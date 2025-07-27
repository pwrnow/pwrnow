#!/bin/sh

# Exit on error
set -e

# Apply database migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput
