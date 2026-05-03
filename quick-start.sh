#!/bin/bash
# Quick start script for development

echo "🎯 Quick Start - Development Mode"

# Start all services with docker-compose
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

# Wait for services
sleep 5

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Summary
echo ""
echo "✅ Quick Start Complete!"
echo ""
echo "🌐 Access points:"
echo "   Frontend:    http://localhost:5173"
echo "   API Gateway: http://localhost:3000"
echo ""
echo "📝 To start development:"
echo "   Frontend:    cd frontend && npm run dev"
echo "   Services:    docker-compose logs -f"
