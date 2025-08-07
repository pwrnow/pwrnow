#!/bin/sh

# Replace environment variables in the alertmanager config
envsubst < /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml

# Start alertmanager with the provided arguments
exec /bin/alertmanager "$@"
