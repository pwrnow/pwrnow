FROM prom/prometheus:latest

# Copy configuration files
COPY prometheus.yml /tmp/prometheus.yml
COPY alert_rules.yml /tmp/alert_rules.yml
COPY start.sh /start.sh

# Make start script executable
RUN chmod +x /start.sh

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
