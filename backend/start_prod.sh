#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

exec pwd

exec python manage.py migrate
exec python manage.py collectstatic --noinput --clear

exec gunicorn config.wsgi --bind 0.0.0.0:5000 --chdir=/app