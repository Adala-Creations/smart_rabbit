# ==============================
# Smart Rabbit - Production Dockerfile
# ==============================

# 1️⃣ Base image
FROM node:20-bullseye-slim

# 2️⃣ Install dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev git curl && \
    rm -rf /var/lib/apt/lists/*

# 3️⃣ Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# 4️⃣ Set working directory
WORKDIR /app

# 5️⃣ Copy package.json & package-lock.json first (Docker cache optimization)
COPY package*.json ./

# 6️⃣ Install dependencies
RUN npm ci --production

# 7️⃣ Copy rest of app
COPY . .

# 8️⃣ Prisma generate
RUN npx prisma generate

# 9️⃣ Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# 🔹 Switch to non-root user
USER appuser

# 1️⃣0️⃣ Set environment variable for Next.js port
ENV PORT=3005

# 1️⃣1️⃣ Expose the port
EXPOSE 3005

# 1️⃣2️⃣ Run build
RUN npm run build

# 1️⃣3️⃣ Start the application
CMD ["npm", "run", "start"]
