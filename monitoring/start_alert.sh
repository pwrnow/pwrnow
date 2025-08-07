#!/bin/sh

echo "Starting Alertmanager setup..."

# Create the alertmanager config directory
mkdir -p /etc/alertmanager

echo "Substituting Discord webhook URL..."

# Substitute environment variables in the template
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    sed "s|\${DISCORD_WEBHOOK_URL}|$DISCORD_WEBHOOK_URL|g" /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
else
    echo "WARNING: DISCORD_WEBHOOK_URL not set, using placeholder"
    cp /etc/alertmanager/alertmanager.yml.template /etc/alertmanager/alertmanager.yml
fi

echo "Configuration processed successfully"

# Start alertmanager directly (no user switching needed)
exec /bin/alertmanager \
    --config.file=/etc/alertmanager/alertmanager.yml \
    --storage.path=/alertmanager \
    --web.external-url=http://localhost:9093 \
    --web.route-prefix=/
