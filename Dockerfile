# ==============================
# Smart Rabbit Production Dockerfile
# ==============================

# Base image
FROM node:20-bullseye-slim AS build

# Install system dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev git curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root app user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Fix permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Entrypoint for migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command
CMD ["npm", "run", "start"]
