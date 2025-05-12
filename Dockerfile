FROM node:22-slim AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN ls -la /app

# Install dependencies
RUN npm install --omit=dev
RUN npm install @angular-devkit/build-angular --save-dev

# Copy the rest of the application files
COPY . .

# Build the Angular application
# RUN npm run build --omit=dev
# CMD ["ng", "build", "--configuration", "production"]
RUN npm run build

# Use a lightweight web server to serve the application
FROM nginx:alpine

# Copy the built application from the previous stage
COPY --from=build /app/dist/portfolio-app /usr/share/nginx/html

# Copy the custom Nginx configuration
ARG NGINX_CONF=nginx.conf
COPY nginx/${NGINX_CONF} /etc/nginx/conf.d/default.conf

# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port the app runs on
EXPOSE 80

# Command to run the application
CMD ["nginx", "-g", "daemon off;"]

