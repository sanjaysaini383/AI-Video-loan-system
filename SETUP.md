# Local Development Setup Guide

This guide will help you set up the LoanVision AI project for local development.

## Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **npm** v9+
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop/))
- **Git** ([download](https://git-scm.com/))
- **Python** 3.9+ (for running Python services locally)

## Quick Start (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git
cd AI-Video-loan-system
```

### 2. Set Up Environment Variables

```bash
# Copy the template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your favorite editor
```

**Required API Keys:**
- **GROQ_API_KEY**: Get free key from [console.groq.com](https://console.groq.com)
- **JWT_SECRET**: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Optional:**
- **DEEPGRAM_API_KEY**: For real speech-to-text
- **GEMINI_API_KEY**: Alternative to Groq

### 3. Start All Services with Docker

```bash
# Install root dependencies
npm install

# Start databases and all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Wait for all services to be healthy** (check `docker-compose ps`).

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Alternative: Frontend Only (No Backend)

For quick UI testing without Docker:

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

The frontend includes built-in simulation data.

---

## Running Individual Services

### Node.js Service

```bash
cd services/api-gateway
npm install
npm run dev  # Starts on port 3000
```

### Python Service

```bash
cd services/risk-service
pip install -r requirements.txt
python -m uvicorn src.main:app --port 3005 --reload
```

---

## Verify Setup

### Check Services are Running

```bash
# List all containers
docker-compose ps

# All should show "healthy" in STATUS
```

### Test API Gateway

```bash
# Should return health info
curl http://localhost:3000/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 50 lines
docker-compose logs --tail=50 api-gateway
```

---

## Development Workflow

### Making Changes

1. **Backend changes**: Services auto-reload (check logs)
2. **Frontend changes**: Vite auto-rebuilds (refresh browser)
3. **Environment changes**: Restart service
   ```bash
   docker-compose restart api-gateway
   ```

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

### Linting & Formatting

```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Building for Production

```bash
# Build all services
npm run build

# Build Docker images
docker-compose build
```

---

## Common Issues & Solutions

### Issue: Ports Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: Docker Compose Won't Start

```bash
# Clean up containers
docker-compose down -v

# Rebuild everything
docker-compose up -d --build
```

### Issue: Out of Memory

```bash
# Increase Docker resources in settings
# Docker Desktop > Settings > Resources
```

### Issue: npm install Fails

```bash
# Clear npm cache
npm cache clean --force

# Use specific node version
nvm install 18
nvm use 18

# Try again
npm install
```

### Issue: Python Service Won't Start

```bash
# Ensure correct Python version
python --version  # Should be 3.9+

# Install dependencies globally if needed
pip install -r services/risk-service/requirements.txt

# Check venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

---

## Database Connection

### PostgreSQL

```bash
# Connect to database
psql -h localhost -U postgres -d video_loan_db

# View password from .env
cat .env | grep POSTGRES_PASSWORD
```

**Connection String:**
```
postgresql://postgres:PASSWORD@localhost:5432/video_loan_db
```

### MongoDB

```bash
# Connect with mongosh
mongosh "mongodb://admin:PASSWORD@localhost:27017"

# View password from .env
cat .env | grep MONGODB_PASSWORD
```

### Redis

```bash
# Connect to Redis
redis-cli

# Verify connection
ping  # Should return PONG
```

---

## Debugging Tips

### Enable Debug Logging

Add to `.env`:
```
LOG_LEVEL=debug
NODE_ENV=development
```

### Check Service Logs

```bash
# Get detailed logs
docker-compose logs api-gateway --tail=100 --follow
```

### Test Individual Endpoints

```bash
# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get status
curl http://localhost:3000/health
```

### Monitor Resource Usage

```bash
# Watch container stats
docker stats

# View specific container
docker stats video-loan-api-gateway
```

---

## Performance Tips

1. **Use Redis cache**: Improves API response times
2. **Enable query logging**: Identify slow queries
3. **Monitor memory**: Services have memory limits in docker-compose.yml
4. **Use indexes**: On frequently queried fields
5. **Batch operations**: When processing large datasets

---

## Reset Everything

```bash
# Stop all services
docker-compose down

# Remove all volumes (data will be lost)
docker-compose down -v

# Clean up unused Docker resources
docker system prune

# Start fresh
docker-compose up -d
```

---

## Next Steps

- 📖 Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🤝 Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- 🔐 Review [SECURITY.md](SECURITY.md) for security best practices
- 📚 See [README.md](README.md) for project overview

---

## Getting Help

- 💬 **Questions?** Open a [GitHub Discussion](https://github.com/sanjaysaini383/AI-Video-loan-system/discussions)
- 🐛 **Found a bug?** [Report an Issue](https://github.com/sanjaysaini383/AI-Video-loan-system/issues)
- 📧 **Security issue?** Email security@example.com

---

Happy coding! 🚀
