FROM prom/node-exporter:latest

# Copy start script
COPY start.sh /start.sh

# Make start script executable
RUN chmod +x /start.sh

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
