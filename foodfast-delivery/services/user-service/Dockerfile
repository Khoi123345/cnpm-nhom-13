# syntax=docker/dockerfile:1
FROM node:18.20.8-alpine

# Cài build tools để node-gyp build libpq (Postgres client)
RUN apk add --no-cache python3 make g++ bash

WORKDIR /usr/src/app

# Copy package.json & package-lock.json (nếu có)
COPY package.json package-lock.json* ./

# Cài dependencies (bỏ qua peer deps)
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code
COPY . .

# Expose cổng
EXPOSE 3000

# Chạy server
CMD ["node", "src/server.js"]
