FROM prom/alertmanager:latest

# Copy configuration template and start script
COPY alertmanager.yml.template /tmp/alertmanager.yml.template
COPY start.sh /start.sh

# Make start script executable
RUN chmod +x /start.sh

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
