# ==============================
# Builder stage
# ==============================
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache bash git
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ==============================
# Runner stage
# ==============================
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3005

CMD ["npm", "start"]
