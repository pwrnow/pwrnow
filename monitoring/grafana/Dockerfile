FROM grafana/grafana-oss:latest

# Copy provisioning configuration
COPY provisioning/ /etc/grafana/provisioning/
COPY start.sh /start.sh

# Make start script executable
RUN chmod +x /start.sh

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
