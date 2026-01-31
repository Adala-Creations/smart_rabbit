# ==============================
# Builder stage
# ==============================
FROM node:20-alpine AS builder

WORKDIR /app

# Install bash & git for Prisma generation
RUN apk add --no-cache bash git

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all app source code
COPY . .

# Generate Prisma client (needs Postgres to be running)
# You can pass DATABASE_URL as a build-arg or ensure it's set in .env
RUN npx prisma generate

# Build Next.js production app
RUN npm run build

# ==============================
# Production stage
# ==============================
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port your app runs on
EXPOSE 3005

# Start the app
CMD ["npm", "start"]
