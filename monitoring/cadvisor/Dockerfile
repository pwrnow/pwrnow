FROM gcr.io/cadvisor/cadvisor:latest

# Copy start script
COPY start.sh /start.sh

# Make start script executable and set as executable by cadvisor user
USER root
RUN chmod +x /start.sh

# Use our custom entrypoint
ENTRYPOINT ["/start.sh"]
