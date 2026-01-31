# ==============================
# Smart Rabbit - Production Dockerfile
# ==============================

# 1️⃣ Base image
FROM node:20-bullseye-slim

# 2️⃣ Install system dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev git curl && \
    rm -rf /var/lib/apt/lists/*

# 3️⃣ Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# 4️⃣ Set working directory
WORKDIR /app

# 5️⃣ Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production

# 6️⃣ Copy the entire app, including prisma schema
COPY . .

# 7️⃣ Generate Prisma client
RUN npx prisma generate

# 8️⃣ Run migrations at build time (optional)
# If you prefer migrations at container start, remove this line and run via `docker exec` or entrypoint
# RUN npx prisma migrate deploy

# 9️⃣ Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# 🔟 Switch to non-root user
USER appuser

# 1️⃣1️⃣ Default command to start the app
CMD ["npm", "run", "start"]
