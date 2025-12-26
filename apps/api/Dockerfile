FROM node:18-alpine AS base

# The API needs access to the Docker daemon to spawn sibling containers
# We install the docker CLI client in this image.
RUN apk add --no-cache docker-cli

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# Install turbo global
RUN npm install -g turbo
COPY . .
# Prune the workspace to just the 'api' app
RUN turbo prune --scope=api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Build the project
RUN npx turbo run build --filter=api...

FROM base AS runner
WORKDIR /app

# Don't run production as root (Recommended, BUT we need root for Docker socket access usually)
# For simplicity in this specific "Code Execution" use case, we might need root or specific group permissions.
# We will stick to root for now to ensure access to /var/run/docker.sock

COPY --from=installer /app .

WORKDIR /app/apps/api

CMD ["npm", "run", "dev"] 
# Ideally should be "start" but api/package.json only has "dev" currently. 
# We will fix this by assuming the user will use "node dist/index.js" or similar if they add a start script.
# For now, let's stick to the existing script or run node directly.
CMD ["node", "dist/index.js"]
