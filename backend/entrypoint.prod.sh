#!/bin/sh

# Exit on error
set -e

# Fix volume mount permissions (this is the key fix!)
echo "Fixing volume permissions..."
sudo chown -R django:django /app/staticfiles /app/media 2>/dev/null || \
chown -R django:django /app/staticfiles /app/media 2>/dev/null || \
chmod -R 777 /app/staticfiles /app/media

# Apply database migrations
python manage.py migrate
python manage.py compilemessages

# Only collect static files for the main backend service, not workers/beat
if [ "${SERVICE:-gunicorn}" = "backend" ] || [ "${SERVICE:-gunicorn}" = "web" ]; then
    echo "Collecting static files for service: ${SERVICE:-gunicorn}"
    python manage.py collectstatic --noinput --clear
else
    echo "Skipping static file collection for service: ${SERVICE}"
fi

# Start the application
exec "$@"