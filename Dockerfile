# Use lightweight Node image
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Set working directory
WORKDIR /app

# Install PM2 globally (Docker-friendly runtime)
RUN npm install -g pm2

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Run build step (produces dist/ folder or compiled assets)
RUN npm run build

# Switch to non-root user
USER app

# Expose the port the app will run on
EXPOSE 3005

# Start the app using PM2 runtime
CMD ["pm2-runtime", "ecosystem.config.js"]
