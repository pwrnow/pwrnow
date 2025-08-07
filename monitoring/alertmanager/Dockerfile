FROM prom/alertmanager:latest

# Copy configuration template and start script
COPY alertmanager.yml.template /tmp/alertmanager.yml.template
COPY start.sh /start.sh

# Switch to root temporarily
USER root

# Copy start script with execute permissions
COPY --chmod=755 start.sh /start.sh

USER nobody

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
