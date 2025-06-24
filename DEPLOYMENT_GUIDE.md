# Multi-Cloud Deployment Guide
## Clinical Insight Assistant

This guide covers deploying the Clinical Insight Assistant on various platforms including local Docker, AWS, GCP, Azure, and Kubernetes.

## 🏗️ Architecture Overview

The application is packaged as a single Docker container that includes:
- **Frontend**: React SPA served by Nginx
- **Backend**: FastAPI application with Uvicorn
- **Reverse Proxy**: Nginx for routing and static file serving
- **Process Management**: Supervisor for managing multiple services

## 📋 Prerequisites

### Required Environment Variables
- `GEMINI_API_KEY`: Your Google Gemini AI API key
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name (default: clinical_assistant)
- `PORT`: Application port (default: 8080)

### Optional Environment Variables
- `NODE_ENV`: Set to "production" for production deployments
- `PYTHONPATH`: Python module path (auto-configured)

## 🚀 Deployment Options

### 1. Local Docker Deployment

#### Quick Start
```bash
# Set required environment variable
export GEMINI_API_KEY="your_gemini_api_key_here"

# Deploy with script
chmod +x scripts/deploy-local.sh
./scripts/deploy-local.sh
```

#### Manual Deployment
```bash
# Build and run production image
docker build -f Dockerfile.production -t clinical-insight-assistant .

# Run with external MongoDB
docker run -d \
  -p 8080:8080 \
  -e GEMINI_API_KEY="your_key" \
  -e MONGO_URL="mongodb://your-mongo-host:27017" \
  -e DB_NAME="clinical_assistant" \
  clinical-insight-assistant

# Or use docker-compose with included MongoDB
docker-compose -f docker-compose.prod.yml up -d
```

### 2. AWS Deployment

#### Option A: ECS Fargate (Recommended)

1. **Build and push to ECR:**
```bash
# Create ECR repository
aws ecr create-repository --repository-name clinical-insight-assistant

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push
export AWS_ECR_REPOSITORY="YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"
./scripts/build-and-push.sh
```

2. **Set up secrets in AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name "clinical-assistant/mongo-url" \
  --secret-string "mongodb://your-atlas-url"

aws secretsmanager create-secret \
  --name "clinical-assistant/gemini-api-key" \
  --secret-string "your_gemini_api_key"
```

3. **Deploy ECS service:**
```bash
# Update cloud/aws/ecs-task-definition.json with your values
aws ecs register-task-definition --cli-input-json file://cloud/aws/ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster your-cluster \
  --service-name clinical-insight-assistant \
  --task-definition clinical-insight-assistant \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### Option B: AWS App Runner
```bash
# Create apprunner.yaml
aws apprunner create-service --service-name clinical-insight-assistant \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "YOUR_ECR_URI",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "DB_NAME": "clinical_assistant"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  }'
```

### 3. Google Cloud Platform Deployment

#### Cloud Run (Recommended)
```bash
# Build and push to GCR
export GCP_PROJECT_ID="your-project-id"
gcloud auth configure-docker
./scripts/build-and-push.sh

# Create secrets
echo -n "your_mongo_url" | gcloud secrets create mongo-url --data-file=-
echo -n "your_gemini_key" | gcloud secrets create gemini-api-key --data-file=-

# Deploy to Cloud Run
gcloud run deploy clinical-insight-assistant \
  --image gcr.io/YOUR_PROJECT_ID/clinical-insight-assistant:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --max-instances 10

# Or use the YAML configuration
gcloud run services replace cloud/gcp/cloud-run-service.yaml
```

#### GKE Deployment
```bash
# Create GKE cluster
gcloud container clusters create clinical-insight-cluster \
  --num-nodes=3 \
  --machine-type=e2-standard-2

# Apply Kubernetes configurations
kubectl apply -f cloud/kubernetes/deployment.yaml
```

### 4. Azure Deployment

#### Container Instances
```bash
# Build and push to ACR
export AZURE_REGISTRY_NAME="your-registry"
az acr create --resource-group myResourceGroup --name $AZURE_REGISTRY_NAME --sku Basic
./scripts/build-and-push.sh

# Deploy container instance
az deployment group create \
  --resource-group myResourceGroup \
  --template-file cloud/azure/container-instance.json \
  --parameters \
    containerImageName="$AZURE_REGISTRY_NAME.azurecr.io/clinical-insight-assistant:latest" \
    mongoUrl="your_mongo_connection_string" \
    geminiApiKey="your_gemini_api_key"
```

#### Azure Container Apps
```bash
# Create container app environment
az containerapp env create \
  --name clinical-insight-env \
  --resource-group myResourceGroup \
  --location eastus

# Deploy container app
az containerapp create \
  --name clinical-insight-assistant \
  --resource-group myResourceGroup \
  --environment clinical-insight-env \
  --image $AZURE_REGISTRY_NAME.azurecr.io/clinical-insight-assistant:latest \
  --target-port 8080 \
  --ingress external \
  --env-vars MONGO_URL="your_mongo_url" GEMINI_API_KEY="your_key"
```

### 5. Kubernetes (Any Provider)

```bash
# Create namespace
kubectl create namespace clinical-insight

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=mongo-url="your_mongo_url" \
  --from-literal=gemini-api-key="your_gemini_key" \
  -n clinical-insight

# Deploy application
kubectl apply -f cloud/kubernetes/deployment.yaml -n clinical-insight

# Get external IP
kubectl get service clinical-insight-assistant-service -n clinical-insight
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)
```bash
# 1. Create MongoDB Atlas cluster
# 2. Create database user
# 3. Whitelist application IPs
# 4. Get connection string:
#    mongodb+srv://username:password@cluster.mongodb.net/clinical_assistant
```

### Self-hosted MongoDB
```bash
# Using Docker
docker run -d \
  --name mongo \
  -p 27017:27017 \
  -v mongo_data:/data/db \
  mongo:7.0

# Connection string: mongodb://localhost:27017
```

## 🔒 Security Considerations

### Production Checklist
- [ ] Use HTTPS/TLS certificates
- [ ] Store secrets in secure secret management services
- [ ] Configure network security groups/firewalls
- [ ] Enable container scanning for vulnerabilities
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Implement rate limiting
- [ ] Use non-root container users

### Environment Variables Security
- Never commit secrets to version control
- Use cloud secret management services:
  - AWS: Secrets Manager / Parameter Store
  - GCP: Secret Manager
  - Azure: Key Vault
  - Kubernetes: Secrets

## 📊 Monitoring & Logging

### Health Checks
The application provides several health check endpoints:
- `/health`: Basic application health
- `/api/`: Backend API health
- `/metrics`: Basic metrics (nginx status)

### Logging
Logs are available in JSON format for cloud monitoring:
- Application logs: `/var/log/supervisor/`
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`

### Cloud Monitoring Integration
- **AWS**: CloudWatch Logs, X-Ray tracing
- **GCP**: Cloud Logging, Cloud Monitoring
- **Azure**: Azure Monitor, Application Insights

## 🚨 Troubleshooting

### Common Issues

1. **Container Won't Start**
```bash
# Check logs
docker logs container-name
kubectl logs pod-name
```

2. **Database Connection Issues**
```bash
# Test connectivity
docker exec -it container-name curl http://localhost:8000/api/
```

3. **Frontend Not Loading**
```bash
# Check nginx status
docker exec -it container-name supervisorctl status nginx
```

4. **High Memory Usage**
```bash
# Monitor resource usage
docker stats container-name
kubectl top pods
```

### Performance Optimization

1. **Scaling**
   - Horizontal: Increase replica count
   - Vertical: Increase CPU/memory limits

2. **Caching**
   - Enable Redis for session management
   - Configure CDN for static assets

3. **Database Optimization**
   - Use MongoDB Atlas for managed scaling
   - Implement connection pooling
   - Add database indexes

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Build and Push
      env:
        GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      run: |
        chmod +x scripts/build-and-push.sh
        ./scripts/build-and-push.sh
```

### Environment-Specific Deployments
- **Development**: Use docker-compose with local MongoDB
- **Staging**: Deploy to cloud with staging database
- **Production**: Full cloud deployment with managed services

---

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Check cloud provider service status

The application is designed to be cloud-agnostic and should work on any platform that supports Docker containers.