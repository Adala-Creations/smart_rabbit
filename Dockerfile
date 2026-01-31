# ==============================
# Builder stage (builds Next.js app)
# ==============================
FROM node:20-alpine AS builder

WORKDIR /app

# Install bash and git (needed for some npm packages)
RUN apk add --no-cache bash git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js app
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
