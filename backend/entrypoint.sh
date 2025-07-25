#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

# Wait for PostgreSQL to be ready
if [ -n "${DATABASE_URL:-}" ]; then
    echo "Waiting for PostgreSQL..."
    until python -c "
import psycopg2
import os
from urllib.parse import urlparse

url = urlparse(os.environ['DATABASE_URL'])
conn = psycopg2.connect(
    database=url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port,
)
conn.close()
    "; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 1
    done
    echo "PostgreSQL is up - continuing..."
fi

exec "$@"