#!/bin/sh

echo "Starting Alertmanager setup..."

# Create alertmanager config directory
mkdir -p /etc/alertmanager

# Substitute environment variables in template
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    echo "Substituting Discord webhook URL..."
    sed "s|\${DISCORD_WEBHOOK_URL}|$DISCORD_WEBHOOK_URL|g" /tmp/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
else
    echo "No Discord webhook URL provided, using template as-is"
    cp /tmp/alertmanager.yml.template /etc/alertmanager/alertmanager.yml
fi

# Set proper ownership
chown -R alertmanager:alertmanager /etc/alertmanager

echo "Configuration processed and permissions set"

# Start Alertmanager as alertmanager user
exec su alertmanager -s /bin/sh -c '/bin/alertmanager \
    --config.file=/etc/alertmanager/alertmanager.yml \
    --storage.path=/alertmanager \
    --web.external-url=http://localhost:9093 \
    --web.route-prefix=/'
