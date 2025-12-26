#!/bin/bash

# --- Configuration ---
APP_NAME="codestream-api"
PORT=80  # Expose on port 80 (HTTP default)
# ---------------------

echo "🚀 Starting Deployment for $APP_NAME..."

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "✅ Docker is already installed."
fi

# 2. Pull latest code (Assumes this script is run inside the repo)
echo "Ep Pulling latest changes from git..."
git pull

# 3. Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "   Please create a .env file with REDIS_URL before running."
    echo "   Example: echo 'REDIS_URL=redis://...' > .env"
    exit 1
fi

# 4. Build Docker Image
echo "cz Building Docker Image..."
# We build from the root context because it's a monorepo
docker build -f apps/api/Dockerfile -t $APP_NAME .

# 5. Stop & Remove Old Container
if [ "$(docker ps -q -f name=$APP_NAME)" ]; then
    echo "vz Stopping existing container..."
    docker stop $APP_NAME
fi

if [ "$(docker ps -aq -f name=$APP_NAME)" ]; then
    echo "ox Removing old container..."
    docker rm $APP_NAME
fi

# 6. Run New Container
echo "cz Starting new container..."
# -v /var/run/docker.sock:/var/run/docker.sock : Critical for "Docker-in-Docker" capability
# --network host : Optional, but mapping ports is usually safer.
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p $PORT:4000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --env-file .env \
  $APP_NAME

echo "✅ Deployment Complete!"
echo "   API is running on port $PORT"
echo "   View logs with: docker logs -f $APP_NAME"
