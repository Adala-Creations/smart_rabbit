# ❌ FROM node:20-alpine
FROM node:20-slim

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

RUN addgroup --system app && adduser --system --ingroup app app
RUN chown -R app:app /app
USER app

EXPOSE 3005
CMD ["npm", "start"]
