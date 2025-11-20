# ---- Base stage ----
FROM node:20-slim AS base

WORKDIR /app

# Install dependencies needed for Next.js
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Dependencies stage ----
FROM base AS deps

COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# ---- Build stage ----
FROM base AS builder

# ⭐️ BƯỚC THÊM QUAN TRỌNG 1: Khai báo ARG để nhận biến từ docker-compose.yml
ARG NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⭐️ BƯỚC THÊM QUAN TRỌNG 2: Đặt biến môi trường sử dụng giá trị của ARG
# Biến này là cần thiết cho Next.js ở Build Time
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# ---- Runtime stage ----
FROM base AS runner

# ⭐️ BƯỚC THÊM QUAN TRỌNG 3: Đảm bảo biến có mặt ở Runtime (cho SSR/Client)
# Nếu bạn không đặt ở đây, Next.js có thể bị lỗi khi chạy
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (Đã sửa lỗi cú pháp hoàn toàn)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]