#!/bin/sh

echo "Starting Prometheus setup..."

# Create prometheus config directory
mkdir -p /etc/prometheus

# Copy configuration files
cp /tmp/prometheus.yml /etc/prometheus/prometheus.yml
cp /tmp/alert_rules.yml /etc/prometheus/alert_rules.yml

echo "Configuration copied successfully"

# Start Prometheus directly (no user switching needed)
exec /bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/prometheus \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.console.templates=/etc/prometheus/consoles \
    --storage.tsdb.retention.time=200h \
    --web.enable-lifecycle \
    --web.enable-admin-api
