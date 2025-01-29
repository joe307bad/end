FROM nginx:alpine

# Copy the nginx configuration
COPY deploy/nginx/server/nginx.conf /etc/nginx/nginx.conf

# Expose the Nginx default port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
