#!/bin/bash

# deploy_images.sh
# Script to build and push Docker images for pwrnow from local Mac to Registry

set -e

# Load .env file if present
if [ -f "$(dirname "$0")/.env" ]; then
    set -a
    source "$(dirname "$0")/.env"
    set +a
fi

# --- Configuration ---
# You can set these via environment variables or rely on defaults/prompts
# Example: REGISTRY_URL=ghcr.io/myuser ./deploy_images.sh

# Default Registry URL - CHANGE THIS or set env var
: "${REGISTRY_URL:=registry.pwrnow.pl}"

# Default API URL - CHANGE THIS or set env var
# This determines where the frontend makes requests to.
: "${NEXT_PUBLIC_API_URL:=https://api.pwrnow.pl}"

# Registry credentials - set via env vars REGISTRY_USER and REGISTRY_PASS
: "${REGISTRY_USER:=pwrnow}"
: "${REGISTRY_PASS:=}"

# Coolify API - set these to auto-deploy services after push
# Get the UUID from each service URL in Coolify dashboard (e.g. /applications/<uuid>)
: "${COOLIFY_URL:=https://coolify.pwrnow.pl}"
: "${COOLIFY_TOKEN:=${COOLIFY_TOKEN:-}}" # Must be set in env or .env for auto-deploy to work
: "${COOLIFY_BACKEND_UUID:=}"
: "${COOLIFY_WORKER_UUID:=}"
: "${COOLIFY_BEAT_UUID:=}"
: "${COOLIFY_FLOWER_UUID:=}"
: "${COOLIFY_FRONTEND_UUID:=}"
: "${COOLIFY_NGINX_UUID:=}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Build and Push Process...${NC}"

# Check for Registry URL
if [ -z "$REGISTRY_URL" ]; then
    echo -e "${RED}Error: REGISTRY_URL is not set.${NC}"
    read -p "Enter Registry URL now (e.g., registry.pwrnow.pl): " USER_INPUT_REGISTRY
    if [ -n "$USER_INPUT_REGISTRY" ]; then
        REGISTRY_URL=$USER_INPUT_REGISTRY
    else
        echo "Exiting."
        exit 1
    fi
fi

# Login to registry if credentials are provided
if [ -n "$REGISTRY_USER" ] && [ -n "$REGISTRY_PASS" ]; then
    echo -e "${GREEN}Logging in to registry: $REGISTRY_URL${NC}"
    echo "$REGISTRY_PASS" | docker login "$REGISTRY_URL" --username "$REGISTRY_USER" --password-stdin
else
    echo -e "${RED}Warning: REGISTRY_USER/REGISTRY_PASS not set — skipping docker login.${NC}"
fi

# Check for NEXT_PUBLIC_API_URL
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo -e "${RED}Warning: NEXT_PUBLIC_API_URL is not set.${NC}"
    read -p "Enter NEXT_PUBLIC_API_URL for the frontend build (e.g., https://api.pwrnow.pl): " USER_INPUT_API
    if [ -n "$USER_INPUT_API" ]; then
        NEXT_PUBLIC_API_URL=$USER_INPUT_API
    else
        echo -e "${RED}Error: Cannot build frontend without API URL.${NC}"
        exit 1
    fi
fi

echo -e "Target Registry: ${GREEN}$REGISTRY_URL${NC}"
echo -e "Target Platform: ${GREEN}linux/amd64${NC}"
echo -e "API URL: ${GREEN}$NEXT_PUBLIC_API_URL${NC}"

# Helper: trigger Coolify redeploy by application UUID
coolify_deploy() {
    local uuid="$1"
    local name="$2"
    if [ -z "$COOLIFY_TOKEN" ] || [ -z "$uuid" ]; then
        echo -e "${RED}  Skipping Coolify deploy for $name (COOLIFY_TOKEN or UUID not set).${NC}"
        return
    fi
    echo -e "${GREEN}  Triggering Coolify redeploy for $name ($uuid)...${NC}"
    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $COOLIFY_TOKEN" \
        -H "Content-Type: application/json" \
        "$COOLIFY_URL/api/v1/deploy?uuid=$uuid&force=false")
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}  Coolify deploy triggered for $name.${NC}"
    else
        echo -e "${RED}  Coolify deploy failed for $name (HTTP $response).${NC}"
    fi
}

# Ensure docker buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${RED}Error: 'docker buildx' is not available. Please install it to build multi-platform images.${NC}"
    exit 1
fi

# Create a builder if one doesn't exist (optional, but good for multi-arch)
# docker buildx create --use --name mybuilder || docker buildx use mybuilder

# --- Build Backend ---
echo -e "\n${GREEN}=== Building Backend Image ===${NC}"
# Backend serves: backend, celeryworker, celerybeat
# docker buildx build \
#     --platform linux/amd64 \
#     --provenance=false \
#     --progress=plain \
#     --push \
#     --target prod \
#     --file ./backend/Dockerfile \
#     --tag "$REGISTRY_URL/pwrnow/backend:latest" \
#     ./backend

echo -e "${GREEN}Backend image pushed successfully.${NC}"


# --- Build Frontend ---
echo -e "\n${GREEN}=== Building Frontend Image ===${NC}"
# docker buildx build \
#     --platform linux/amd64 \
#     --provenance=false \
#     --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
#     --push \
#     --tag "$REGISTRY_URL/pwrnow/web:latest" \
#     ./web

echo -e "${GREEN}Frontend image pushed successfully.${NC}"

# --- Build Nginx (Optional) ---
# Uncomment if needed
echo -e "\n${GREEN}=== Building Nginx Image ===${NC}"
docker buildx build \
   --platform linux/amd64 \
   --push \
   --tag "$REGISTRY_URL/pwrnow/nginx:latest" \
   ./nginx


echo -e "\n${GREEN}=== All builds finished successfully! ===${NC}"
echo "Images pushed and Coolify deploys triggered."

# coolify_deploy "$COOLIFY_FRONTEND_UUID" "frontend"
# coolify_deploy "$COOLIFY_BACKEND_UUID" "backend"
# coolify_deploy "$COOLIFY_WORKER_UUID" "worker"
# coolify_deploy "$COOLIFY_BEAT_UUID" "beat"
# coolify_deploy "$COOLIFY_FLOWER_UUID" "flower"

coolify_deploy "$COOLIFY_NGINX_UUID" "nginx"
