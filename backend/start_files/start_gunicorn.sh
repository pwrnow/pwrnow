#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

# Collect static files
python manage.py collectstatic --noinput --clear

exec gunicorn config.wsgi --bind 0.0.0.0:5000 --chdir=/app