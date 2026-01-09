# ---------- Base ----------
# Create a clean Linux machine with Node installed, and work inside /app.
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps

# Prisma needs DATABASE_URL at generate time
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db"
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json package-lock.json ./
# Read schema.prisma
COPY prisma ./prisma
# Generate Prisma Client
COPY prisma.config.ts ./
RUN npm ci
RUN npx prisma generate

# ---------- Build ----------
FROM base AS build
# Docker stages are isolated
# COPY everything needed for build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json package-lock.json ./
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

# ---------- Production ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=50s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/database || exit 1
