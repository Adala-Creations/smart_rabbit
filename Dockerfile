# ==============================
# Builder stage
# ==============================
FROM node:20-alpine AS builder

# Install bash & git (needed for Prisma & dev scripts)
RUN apk add --no-cache bash git

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy everything else
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app (produces .next)
RUN npm run build

# ==============================
# Production stage
# ==============================
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy build output and public files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy next.config.ts (Next.js reads this automatically)
COPY --from=builder /app/next.config.ts ./

# Copy Prisma client and schema if needed at runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables (optional: you can load via .env)
# ENV NODE_ENV=production

# Expose port
EXPOSE 3005

# Start the app
CMD ["npm", "start"]
