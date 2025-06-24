#!/bin/bash
# Deploy Clinical Insight Assistant locally with Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying Clinical Insight Assistant locally...${NC}"

# Check if required environment variables are set
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}Error: GEMINI_API_KEY environment variable is required${NC}"
    echo "Please set it: export GEMINI_API_KEY=your_api_key_here"
    exit 1
fi

# Set default values
export DB_NAME=${DB_NAME:-clinical_assistant}
export PORT=${PORT:-8080}

# Create .env file for docker-compose
cat > .env << EOF
GEMINI_API_KEY=$GEMINI_API_KEY
DB_NAME=$DB_NAME
PORT=$PORT
MONGO_URL=mongodb://mongo:27017
NODE_ENV=production
EOF

echo -e "${YELLOW}Building and starting services...${NC}"

# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for services to be healthy
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
        echo -e "${GREEN}Services are ready!${NC}"
        break
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo "Waiting... ($elapsed/$timeout seconds)"
done

if [ $elapsed -ge $timeout ]; then
    echo -e "${RED}Timeout waiting for services to become healthy${NC}"
    echo "Check logs: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Application is available at: http://localhost:$PORT${NC}"
echo -e "${YELLOW}API endpoint: http://localhost:$PORT/api/${NC}"
echo -e "${YELLOW}Health check: http://localhost:$PORT/health${NC}"

echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo -e "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo -e "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo -e "  Check status: docker-compose -f docker-compose.prod.yml ps"