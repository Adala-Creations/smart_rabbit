# Use Node Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Install global dependencies
RUN npm install -g pm2

# Copy package.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy rest of the app
COPY . .

# Build as non-root user
USER app

# Build the Next.js app
RUN npm run build

# Expose the port
EXPOSE 3005

# Start the app with PM2
CMD ["pm2-runtime", "npm", "--", "start"]
