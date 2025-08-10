#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

# Collect static files
python manage.py collectstatic --noinput --clear
python manage.py compilemessages


exec gunicorn config.wsgi --config gunicorn.conf.py --chdir=/app