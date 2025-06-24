#!/bin/bash
# Build and push Clinical Insight Assistant to container registries

set -e

# Configuration
APP_NAME="clinical-insight-assistant"
VERSION=${1:-latest}
DOCKERFILE=${2:-Dockerfile.production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Clinical Insight Assistant Docker image...${NC}"

# Build the image
docker build -f $DOCKERFILE -t $APP_NAME:$VERSION .

echo -e "${GREEN}Image built successfully!${NC}"

# Function to push to different registries
push_to_registry() {
    local registry=$1
    local repository=$2
    
    echo -e "${YELLOW}Pushing to $registry...${NC}"
    
    case $registry in
        "aws")
            # AWS ECR
            aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $repository
            docker tag $APP_NAME:$VERSION $repository/$APP_NAME:$VERSION
            docker tag $APP_NAME:$VERSION $repository/$APP_NAME:latest
            docker push $repository/$APP_NAME:$VERSION
            docker push $repository/$APP_NAME:latest
            ;;
        "gcp")
            # Google Container Registry
            gcloud auth configure-docker
            docker tag $APP_NAME:$VERSION gcr.io/$repository/$APP_NAME:$VERSION
            docker tag $APP_NAME:$VERSION gcr.io/$repository/$APP_NAME:latest
            docker push gcr.io/$repository/$APP_NAME:$VERSION
            docker push gcr.io/$repository/$APP_NAME:latest
            ;;
        "azure")
            # Azure Container Registry
            az acr login --name $repository
            docker tag $APP_NAME:$VERSION $repository.azurecr.io/$APP_NAME:$VERSION
            docker tag $APP_NAME:$VERSION $repository.azurecr.io/$APP_NAME:latest
            docker push $repository.azurecr.io/$APP_NAME:$VERSION
            docker push $repository.azurecr.io/$APP_NAME:latest
            ;;
        "dockerhub")
            # Docker Hub
            docker tag $APP_NAME:$VERSION $repository/$APP_NAME:$VERSION
            docker tag $APP_NAME:$VERSION $repository/$APP_NAME:latest
            docker push $repository/$APP_NAME:$VERSION
            docker push $repository/$APP_NAME:latest
            ;;
        *)
            echo -e "${RED}Unknown registry: $registry${NC}"
            return 1
            ;;
    esac
    
    echo -e "${GREEN}Successfully pushed to $registry!${NC}"
}

# Push to registries based on environment variables
if [ ! -z "$AWS_ECR_REPOSITORY" ]; then
    push_to_registry "aws" "$AWS_ECR_REPOSITORY"
fi

if [ ! -z "$GCP_PROJECT_ID" ]; then
    push_to_registry "gcp" "$GCP_PROJECT_ID"
fi

if [ ! -z "$AZURE_REGISTRY_NAME" ]; then
    push_to_registry "azure" "$AZURE_REGISTRY_NAME"
fi

if [ ! -z "$DOCKERHUB_USERNAME" ]; then
    push_to_registry "dockerhub" "$DOCKERHUB_USERNAME"
fi

echo -e "${GREEN}Build and push completed successfully!${NC}"
echo -e "${YELLOW}To deploy:${NC}"
echo -e "  Local: docker run -p 8080:8080 -e GEMINI_API_KEY=your_key $APP_NAME:$VERSION"
echo -e "  AWS: Update ECS task definition and deploy"
echo -e "  GCP: gcloud run deploy --image gcr.io/$GCP_PROJECT_ID/$APP_NAME:$VERSION"
echo -e "  Azure: az container create using the container instance template"