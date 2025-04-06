# EKS Deployment Guide for Chatbot API

## Prerequisites
- AWS CLI installed and configured
- kubectl installed
- Docker installed
- Python 3.x and pip
- OpenAI API key
- eksctl installed
- AWS IAM credentials with appropriate permissions

## Step-by-Step Deployment Process

### 1. Local Testing
```bash
# Navigate to source directory
cd src

# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload
```

### 2. Docker Build and Test
```bash
# Build the Docker image
docker build -t chatbot-api ./src

# Test locally
docker run -d -p 8000:8000 chatbot-api
```

### 3. AWS Configuration
```bash
# Configure AWS CLI with your credentials
aws configure
```

### 4. Create EKS Cluster
```bash
# Create EKS cluster using eksctl
eksctl create cluster \
    --name chatbot-cluster \
    --region us-east-1 \
    --node-type t3.medium \
    --nodes 2 \
    --nodes-min 2 \
    --nodes-max 4 \
    --with-oidc \
    --ssh-access \
    --ssh-public-key your-key-name \
    --managed
```

### 5. Configure kubectl
```bash
# Update kubeconfig to connect to your EKS cluster
aws eks update-kubeconfig --name chatbot-cluster --region us-east-1
```

### 6. Build and Push Docker Image

```bash
# Navigate to source directory
cd src

# Build the Docker image
docker build -t chatbot-api .

# Tag the image for ECR
aws ecr create-repository --repository-name chatbot-api
docker tag chatbot-api:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/chatbot-api:latest

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Push the image
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/chatbot-api:latest
```

### 7. Update Kubernetes Manifests
Update the image in `k8s/deployment.yaml`:
```yaml
image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/chatbot-api:latest
```

### 8. Deploy to Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 9. Deploy Monitoring Stack
```bash
# Deploy monitoring components
kubectl apply -f monitoring/

# Access monitoring:
# - Prometheus: http://prometheus.<your-domain>
# - Grafana: http://grafana.<your-domain>
# - Kibana: http://kibana.<your-domain>
```

### 10. Run Load Tests
```bash
# Execute K6 load tests
k6 run load-testing/load-test.js
```

## Verification Steps

### 1. Check Deployments
```bash
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress
```

### 2. Test API
```bash
# Get the API endpoint
export API_URL=$(kubectl get ingress chatbot-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test the API
curl -X POST $API_URL/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### 3. Monitor Performance
- Check Grafana dashboards for metrics
- View logs in Kibana
- Monitor Prometheus alerts

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key
- `MODEL_NAME`: OpenAI model to use
- Other environment-specific variables

### Resource Limits
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

## Cleanup
```bash
# Remove application
kubectl delete -f k8s/

# Remove monitoring
kubectl delete -f monitoring/

# Delete the cluster
eksctl delete cluster --name chatbot-cluster --region us-east-1
```

## Troubleshooting

### Common Issues
1. Pod startup failures
   - Check logs: `kubectl logs <pod-name>`
   - Verify environment variables
   - Check OpenAI API key

2. API connectivity issues
   - Verify ingress configuration
   - Check service endpoints
   - Test network policies

3. Monitoring issues
   - Verify Prometheus targets
   - Check Grafana datasources
   - Validate ELK stack connectivity

## Cost Considerations
- EKS cluster management fee
- EC2 instances for worker nodes
- Load balancer costs
- ECR storage and data transfer
- CloudWatch logs (if enabled)

## Security Best Practices
1. Enable EKS control plane logging
2. Use IAM roles for service accounts
3. Implement pod security policies
4. Regular security updates
5. Network policy enforcement
6. Secrets management using AWS Secrets Manager
