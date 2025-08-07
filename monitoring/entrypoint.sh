#!/bin/sh

# Check if envsubst is available, if not use sed as fallback
if command -v envsubst >/dev/null 2>&1; then
    # Use envsubst if available
    envsubst < /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
else
    # Fallback to sed replacement
    sed "s|\${DISCORD_WEBHOOK_URL}|${DISCORD_WEBHOOK_URL}|g" /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
fi

# Start alertmanager with the provided arguments
exec /bin/alertmanager "$@"
