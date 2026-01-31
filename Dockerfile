# ==============================
# Production stage
# ==============================
FROM node:20-alpine

WORKDIR /app

# Install bash, curl, and locales
RUN apk add --no-cache bash curl tzdata icu-libs

# Copy built files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts

# Set environment variables to ensure Next.js binds correctly
ENV PORT=3005
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV LANG=en_US.UTF-8
ENV TZ=UTC

# Expose port
EXPOSE 3005

# Start the app
CMD ["npm", "start"]
