# ---- Base stage ----
FROM node:20-alpine AS base

WORKDIR /app

# Cài build tools + PostgreSQL client dev
RUN apk add --no-cache python3 make g++ bash postgresql-dev

# ---- Dependencies stage ----
FROM base AS deps

COPY package.json package-lock.json* ./

# Cài dependencies, bỏ qua peer deps
RUN npm install --legacy-peer-deps

# ---- Build stage ----
FROM deps AS builder

COPY . .

# Build Next.js
RUN npm run build

# ---- Runtime stage ----
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
