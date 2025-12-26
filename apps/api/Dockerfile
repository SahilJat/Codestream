FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat docker-cli
WORKDIR /app
# Install turbo global
RUN npm install -g turbo

FROM base AS builder
COPY . .
# Prune the workspace to just the 'api' app
RUN turbo prune --scope=api --docker

FROM base AS installer
WORKDIR /app
# First install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
# CI installs are cleaner and faster
RUN npm ci

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo run build --filter=api...

FROM base AS runner
WORKDIR /app
# Only copy the built artifacts and node_modules
COPY --from=installer /app .
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]