#!/bin/sh

# Exit on error
set -e

# Fix volume mount permissions (best-effort, may fail as non-root)
echo "Fixing volume permissions..."
chown -R django:django /app/staticfiles /app/media 2>/dev/null || \
chmod -R 777 /app/staticfiles /app/media 2>/dev/null || \
echo "Warning: Could not fix volume permissions (running as non-root). Ensure volumes are owned by uid $(id -u)."

# Apply database migrations
python manage.py migrate

# Only collect static files for the main backend service, not workers/beat
if [ "${SERVICE:-gunicorn}" = "backend" ] || [ "${SERVICE:-gunicorn}" = "web" ]; then
    echo "Collecting static files for service: ${SERVICE:-gunicorn}"
    python manage.py collectstatic --noinput --clear
else
    echo "Skipping static file collection for service: ${SERVICE}"
fi

# Start the application
exec "$@"