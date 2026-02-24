FROM node:20-alpine
WORKDIR /app

# Install dependencies (all, including devDeps needed for build)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma Client (schema only — no DB connection needed)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Push schema to the SQLite volume (idempotent), then start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
