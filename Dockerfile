# ==============================
# Smart Rabbit - Production Dockerfile
# ==============================

# 1️⃣ Base image
FROM node:20-bullseye-slim AS build

# 2️⃣ Install system dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev git curl && \
    rm -rf /var/lib/apt/lists/*

# 3️⃣ Create non-root app user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# 4️⃣ Set working directory
WORKDIR /app

# 5️⃣ Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production

# 6️⃣ Copy the rest of the app
COPY . .

# 7️⃣ Generate Prisma client
RUN npx prisma generate

# 8️⃣ Fix permissions on /app
RUN chown -R appuser:appgroup /app

# 9️⃣ Switch to non-root user
USER appuser

# 1️⃣0️⃣ Entrypoint for automatic Prisma migrations
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# 1️⃣1️⃣ Default command to start app
CMD ["npm", "run", "start"]
