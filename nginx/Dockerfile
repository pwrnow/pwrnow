FROM docker.io/nginx:1.25-alpine

# Copy nginx configuration
COPY ./static-media.conf /etc/nginx/conf.d/default.conf

# Create directories for static and media files
RUN mkdir -p /usr/share/nginx/html/static \
    && mkdir -p /usr/share/nginx/html/media \
    && chown -R nginx:nginx /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]