# Stage 1: Build (optional minification step)
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
# No build step needed for static files — just copy

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy static site
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/css/ /usr/share/nginx/html/css/
COPY --from=build /app/js/ /usr/share/nginx/html/js/
COPY --from=build /app/assets/ /usr/share/nginx/html/assets/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
