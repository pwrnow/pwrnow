FROM prom/prometheus:latest

# Copy configuration files
COPY prometheus.yml /tmp/prometheus.yml
COPY alert_rules.yml /tmp/alert_rules.yml

# Switch to root temporarily
USER root

# Copy start script with execute permissions
COPY --chmod=755 start.sh /start.sh

USER nobody

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
