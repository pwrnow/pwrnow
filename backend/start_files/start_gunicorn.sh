#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

# Collect static files
python manage.py collectstatic --noinput --clear

exec gunicorn config.wsgi --config gunicorn.conf.py --chdir=/app