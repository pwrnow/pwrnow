#!/bin/sh

echo "Starting Grafana setup..."

# Set default admin password if not provided
export GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD:-admin}

echo "Grafana admin password set"
echo "Database configuration:"
echo "  Type: ${GF_DATABASE_TYPE:-sqlite3}"
echo "  Host: ${GF_DATABASE_HOST:-}"
echo "  User: ${GF_DATABASE_USER:-}"

# Start Grafana using the original entrypoint
exec /run.sh
