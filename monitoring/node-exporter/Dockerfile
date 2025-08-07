FROM prom/node-exporter:latest

# Switch to root temporarily
USER root

# Copy start script with execute permissions
COPY --chmod=755 start.sh /start.sh

USER nobody

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]