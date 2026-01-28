# Use Node Alpine image (lightweight)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files first for caching
COPY package*.json ./

# Install all dependencies (devDependencies needed for build)
RUN npm ci

# Copy all source code
COPY . .

# Build Next.js app
RUN npm run build

# Switch to non-root user
USER app

# Expose port 3005
EXPOSE 3005

# Start app using PM2 runtime
CMD ["pm2-runtime", "node_modules/.bin/next", "--", "start", "-p", "3005"]
