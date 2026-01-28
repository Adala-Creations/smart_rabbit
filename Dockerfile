FROM node:20-alpine

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Install PM2 runtime
RUN npm install -g pm2

# Copy package files first
COPY package*.json ./

# Install dependencies safely
RUN npm ci --omit=dev --ignore-scripts

# Copy app code
COPY . .

# Switch to non-root user
USER app

EXPOSE 3005

# Start app using PM2 runtime
CMD ["pm2-runtime", "ecosystem.config.js"]
