# ==============================
# Builder stage (builds Next.js app)
# ==============================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install bash and git (needed for some npm packages)
RUN apk add --no-cache bash git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app (produces .next)
RUN npm run build

# ==============================
# Production stage
# ==============================
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy Next.js build output from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3005

# Start the production server
CMD ["npm", "start"]
