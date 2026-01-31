# ==============================
# Smart Rabbit - Production Dockerfile
# ==============================

FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev git curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
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

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Default command to run migrations then start app
CMD sh -c "npx prisma generate && npx prisma migrate deploy && npm run start"
