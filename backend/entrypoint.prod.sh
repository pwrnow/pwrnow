#!/bin/sh

# Exit on error
set -e

# Apply database migrations
python manage.py migrate



# Start the application
exec "$@"