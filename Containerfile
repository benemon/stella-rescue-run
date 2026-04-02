# Containerfile for Stella's Rescue Run
# Uses unprivileged nginx for OpenShift compatibility

FROM nginxinc/nginx-unprivileged:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy application files
COPY app/ /usr/share/nginx/html/

# Expose port 8080 (non-root nginx)
EXPOSE 8080

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
