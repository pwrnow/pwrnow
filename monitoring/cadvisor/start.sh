#!/bin/sh

echo "Starting cAdvisor..."

# Start cAdvisor with container monitoring
exec /usr/bin/cadvisor \
    -logtostderr \
    -port=8080
