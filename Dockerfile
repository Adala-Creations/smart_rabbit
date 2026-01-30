FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci   # installs devDependencies too

COPY . .

RUN npx prisma generate
RUN npm run build

# NOW switch to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system app && adduser --system --ingroup app app
RUN chown -R app:app /app
USER app

EXPOSE 3005
CMD ["npm", "start"]
