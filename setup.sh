#!/bin/bash
# Setup script for Video Loan System

set -e

echo "🚀 Setting up Video-Based Digital Loan Origination System"

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your credentials"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build services
echo "🔨 Building services..."
npm run build

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to become healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your API keys"
echo "2. Run database migrations (if needed): npm run db:migrate"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:5173"
echo ""
echo "📚 Services running on:"
echo "   - API Gateway: http://localhost:3000"
echo "   - Frontend: http://localhost:5173"
echo "   - PostgreSQL: localhost:5432"
echo "   - MongoDB: localhost:27017"
echo "   - Redis: localhost:6379"
