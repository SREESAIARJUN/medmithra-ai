#!/bin/bash
# Test script for Clinical Insight Assistant Docker deployment

set -e

echo "🧪 Clinical Insight Assistant - Deployment Test Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test functions
test_docker_available() {
    echo -e "${BLUE}Checking Docker availability...${NC}"
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker is available${NC}"
        docker --version
        return 0
    else
        echo -e "${RED}✗ Docker is not available${NC}"
        return 1
    fi
}

test_environment_variables() {
    echo -e "${BLUE}Checking environment variables...${NC}"
    
    if [ -z "$GEMINI_API_KEY" ]; then
        echo -e "${RED}✗ GEMINI_API_KEY is not set${NC}"
        echo "Please set: export GEMINI_API_KEY=your_api_key_here"
        return 1
    else
        echo -e "${GREEN}✓ GEMINI_API_KEY is set${NC}"
    fi
    
    echo -e "${GREEN}✓ Environment variables check passed${NC}"
    return 0
}

test_build_image() {
    echo -e "${BLUE}Building Docker image...${NC}"
    
    if docker build -f Dockerfile.production -t clinical-insight-assistant:test .; then
        echo -e "${GREEN}✓ Docker image built successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Docker image build failed${NC}"
        return 1
    fi
}

test_run_container() {
    echo -e "${BLUE}Testing container startup...${NC}"
    
    # Stop any existing test container
    docker stop clinical-insight-test 2>/dev/null || true
    docker rm clinical-insight-test 2>/dev/null || true
    
    # Run container in background
    if docker run -d \
        --name clinical-insight-test \
        -p 8080:8080 \
        -e GEMINI_API_KEY="$GEMINI_API_KEY" \
        -e MONGO_URL="mongodb://host.docker.internal:27017" \
        -e DB_NAME="clinical_assistant_test" \
        clinical-insight-assistant:test; then
        
        echo -e "${GREEN}✓ Container started successfully${NC}"
        
        # Wait for container to be ready
        echo -e "${BLUE}Waiting for services to start...${NC}"
        sleep 30
        
        # Test health endpoint
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${RED}✗ Health check failed${NC}"
            echo "Container logs:"
            docker logs clinical-insight-test
            return 1
        fi
        
        # Test API endpoint
        if curl -f http://localhost:8080/api/ > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API endpoint responding${NC}"
        else
            echo -e "${RED}✗ API endpoint not responding${NC}"
            return 1
        fi
        
        # Clean up
        docker stop clinical-insight-test
        docker rm clinical-insight-test
        
        return 0
    else
        echo -e "${RED}✗ Container failed to start${NC}"
        return 1
    fi
}

test_docker_compose() {
    echo -e "${BLUE}Testing Docker Compose deployment...${NC}"
    
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose is available${NC}"
        
        # Create temporary .env file
        cat > .env.test << EOF
GEMINI_API_KEY=$GEMINI_API_KEY
DB_NAME=clinical_assistant_test
PORT=8080
MONGO_URL=mongodb://mongo:27017
NODE_ENV=production
EOF
        
        # Test docker-compose syntax
        if docker-compose -f docker-compose.prod.yml config > /dev/null; then
            echo -e "${GREEN}✓ Docker Compose configuration is valid${NC}"
        else
            echo -e "${RED}✗ Docker Compose configuration has errors${NC}"
            rm .env.test
            return 1
        fi
        
        rm .env.test
        return 0
    else
        echo -e "${YELLOW}⚠ Docker Compose not available, skipping test${NC}"
        return 0
    fi
}

test_cloud_configs() {
    echo -e "${BLUE}Validating cloud deployment configurations...${NC}"
    
    # Check if cloud config files exist
    if [ -f "cloud/aws/ecs-task-definition.json" ]; then
        echo -e "${GREEN}✓ AWS ECS configuration found${NC}"
    else
        echo -e "${RED}✗ AWS ECS configuration missing${NC}"
    fi
    
    if [ -f "cloud/gcp/cloud-run-service.yaml" ]; then
        echo -e "${GREEN}✓ GCP Cloud Run configuration found${NC}"
    else
        echo -e "${RED}✗ GCP Cloud Run configuration missing${NC}"
    fi
    
    if [ -f "cloud/azure/container-instance.json" ]; then
        echo -e "${GREEN}✓ Azure Container Instance configuration found${NC}"
    else
        echo -e "${RED}✗ Azure Container Instance configuration missing${NC}"
    fi
    
    if [ -f "cloud/kubernetes/deployment.yaml" ]; then
        echo -e "${GREEN}✓ Kubernetes deployment configuration found${NC}"
    else
        echo -e "${RED}✗ Kubernetes deployment configuration missing${NC}"
    fi
    
    return 0
}

run_all_tests() {
    echo -e "${BLUE}Running all deployment tests...${NC}"
    
    local failed=0
    
    test_environment_variables || failed=$((failed + 1))
    echo ""
    
    test_docker_available || failed=$((failed + 1))
    echo ""
    
    if command -v docker &> /dev/null; then
        test_build_image || failed=$((failed + 1))
        echo ""
        
        test_run_container || failed=$((failed + 1))
        echo ""
        
        test_docker_compose || failed=$((failed + 1))
        echo ""
    fi
    
    test_cloud_configs
    echo ""
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Deployment is ready.${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Deploy locally: ./scripts/deploy-local.sh"
        echo "2. Build and push: ./scripts/build-and-push.sh"
        echo "3. Deploy to cloud using configurations in /cloud/"
    else
        echo -e "${RED}❌ $failed test(s) failed. Please fix the issues before deploying.${NC}"
        exit 1
    fi
}

# Main execution
case "${1:-all}" in
    "env")
        test_environment_variables
        ;;
    "docker")
        test_docker_available
        ;;
    "build")
        test_build_image
        ;;
    "run")
        test_run_container
        ;;
    "compose")
        test_docker_compose
        ;;
    "cloud")
        test_cloud_configs
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 [env|docker|build|run|compose|cloud|all]"
        echo ""
        echo "Tests:"
        echo "  env     - Check environment variables"
        echo "  docker  - Check Docker availability" 
        echo "  build   - Test Docker image build"
        echo "  run     - Test container execution"
        echo "  compose - Test Docker Compose"
        echo "  cloud   - Validate cloud configurations"
        echo "  all     - Run all tests (default)"
        exit 1
        ;;
esac