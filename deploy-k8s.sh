#!/bin/bash
# Deployment script for Kubernetes (optional)

echo "🚀 Preparing for Kubernetes deployment"

# Build Docker images
docker build -t video-loan/api-gateway services/api-gateway
docker build -t video-loan/session-service services/session-service
docker build -t video-loan/media-service services/media-service
docker build -t video-loan/stt-service services/stt-service
docker build -t video-loan/kyc-service services/kyc-service
docker build -t video-loan/risk-service services/risk-service
docker build -t video-loan/vision-service services/vision-service
docker build -t video-loan/llm-service services/llm-service
docker build -t video-loan/offer-service services/offer-service
docker build -t video-loan/audit-service services/audit-service
docker build -t video-loan/frontend frontend

echo "✅ Docker images built successfully"
echo ""
echo "📝 To deploy to Kubernetes:"
echo "1. Push images to your registry"
echo "2. Create k8s manifests (deployment.yaml, service.yaml, etc.)"
echo "3. Apply with: kubectl apply -f k8s/"
