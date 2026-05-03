# 🐳 Docker Quick Reference

## Installation

### Windows
1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Run installer and follow prompts
3. Restart computer
4. Verify: Open PowerShell and run `docker --version`

### Mac
1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Drag Docker.app to Applications folder
3. Launch Docker from Applications
4. Verify: Open Terminal and run `docker --version`

### Linux (Ubuntu/Debian)
```bash
# Install Docker
sudo apt-get install docker.io

# Install Docker Compose
sudo apt-get install docker-compose

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER

# Verify
docker --version
docker-compose --version
```

---

## Essential Docker Commands

### Check Docker Status
```bash
# Verify Docker is running
docker ps

# Show Docker version
docker --version
docker-compose --version
```

### Build & Start
```bash
# Build all images
docker-compose build

# Build without cache (fresh build)
docker-compose build --no-cache

# Start all containers in background
docker-compose up -d

# Start and watch logs
docker-compose up

# Start specific service
docker-compose up -d api-gateway
```

### Stop & Clean
```bash
# Stop all containers (keeps data)
docker-compose stop

# Stop specific container
docker-compose stop api-gateway

# Remove all containers (keeps data)
docker-compose down

# Remove everything (delete data!)
docker-compose down -v

# Remove specific container
docker-compose rm api-gateway
```

### View Status & Logs
```bash
# List all running containers
docker-compose ps

# View all logs
docker-compose logs

# View logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api-gateway

# View last 50 lines
docker-compose logs -f --tail 50

# View logs for multiple services
docker-compose logs -f api-gateway session-service
```

### Execute Commands
```bash
# Run command in container
docker-compose exec api-gateway npm run dev

# Open bash shell in container
docker-compose exec postgres bash

# Run psql in postgres container
docker-compose exec postgres psql -U postgres

# Run tests in service
docker-compose exec api-gateway npm test
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d video_loan_db

# Connect to MongoDB
docker-compose exec mongo mongosh

# Connect to Redis
docker-compose exec redis redis-cli
```

### Troubleshooting
```bash
# Inspect container
docker-compose exec api-gateway sh

# Check container health
docker-compose ps

# View detailed container info
docker-compose exec api-gateway docker inspect

# Restart service
docker-compose restart api-gateway

# Rebuild and restart
docker-compose up -d --build api-gateway

# Check image size
docker images
```

---

## Quick Start Commands

### First Time Setup
```bash
# 1. Navigate to project
cd d:\SF-Repos\video-loan-system

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your API keys
# (Open .env in your editor)

# 4. Build Docker images
docker-compose build

# 5. Start all services
docker-compose up -d

# 6. Verify everything is running
docker-compose ps

# 7. Install NPM dependencies
npm install

# 8. Start frontend
cd frontend
npm run dev
```

### Daily Development
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs if needed
docker-compose logs -f

# When done, stop services
docker-compose stop
```

### Common Tasks

**Install NPM package in a service:**
```bash
docker-compose exec api-gateway npm install package-name
```

**Run Python migrations:**
```bash
docker-compose exec risk-service pip install -r requirements.txt
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up -d
```

**Rebuild specific service:**
```bash
docker-compose build --no-cache api-gateway
docker-compose up -d api-gateway
```

---

## Docker Files in Project

### docker-compose.yml
Main orchestration file that defines all services:
- `postgres` - PostgreSQL database
- `mongo` - MongoDB database
- `redis` - Redis cache
- `api-gateway` - Express API
- `session-service` - WebSocket service
- `media-service` - File handling
- `stt-service` - Speech-to-text
- `kyc-service` - Identity verification
- `risk-service` - Risk scoring
- `vision-service` - Age detection
- `llm-service` - AI analysis
- `offer-service` - Offer generation
- `audit-service` - Audit logging

### Dockerfile (in each service)
Individual container definitions for each service

---

## Environment Variables in Docker

All services read from `.env` file:
- Located at project root: `d:\SF-Repos\video-loan-system\.env`
- Referenced by `docker-compose.yml`
- Automatically loaded by all containers

**To update environment:**
1. Edit `.env` file
2. Restart containers: `docker-compose restart`

---

## Volumes & Data Persistence

Data is stored in volumes:
```bash
# List volumes
docker volume ls

# View volume data (PostgreSQL)
docker-compose exec postgres ls /var/lib/postgresql/data

# Backup database
docker-compose exec postgres pg_dump -U postgres video_loan_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres video_loan_db < backup.sql
```

---

## Networking

Docker Compose creates a network where services communicate:
- Service names are hostnames
- Example: `postgres:5432` from other containers
- `localhost:PORT` from your machine

**Common service URLs:**
```
PostgreSQL:    postgres:5432
MongoDB:       mongo:27017
Redis:         redis:6379
API Gateway:   api-gateway:3000
```

---

## Common Issues & Solutions

### "Docker daemon is not running"
```bash
# Solution:
# Windows/Mac: Open Docker Desktop application
# Linux: sudo systemctl start docker
```

### "Cannot connect to Docker daemon"
```bash
# Solution: Start Docker service
# Windows: Restart Docker Desktop
# Linux: sudo systemctl restart docker
```

### "Port already in use"
```bash
# Solution: Change port in docker-compose.yml
# From:  "3000:3000"
# To:    "3001:3000"
# Or kill process: lsof -ti:3000 | xargs kill -9
```

### "No space left on device"
```bash
# Solution: Clean up Docker
docker system prune -a
docker volume prune
```

### "Service won't start"
```bash
# Check logs
docker-compose logs service-name

# Rebuild
docker-compose build --no-cache service-name

# Restart
docker-compose up -d service-name
```

### "Database connection refused"
```bash
# Wait for database to start
docker-compose logs postgres
# Look for "ready to accept connections"

# Then restart other services
docker-compose restart api-gateway
```

---

## Docker Performance Tips

### Limit Resource Usage
Edit `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Speed Up Builds
```bash
# Use layer caching
docker-compose build

# Multi-stage builds (already in Dockerfiles)
# Reduces final image size
```

### Improve Startup Time
```bash
# Start only needed services
docker-compose up -d postgres mongo redis api-gateway

# Exclude heavy services
docker-compose up -d --scale risk-service=0
```

---

## Docker Compose File Reference

### View and edit configuration
```bash
# Show effective docker-compose config
docker-compose config

# Edit docker-compose.yml
# Add new service, port, volume, etc.

# Validate config
docker-compose config --quiet
```

### Service Structure
```yaml
services:
  service-name:
    build:
      context: ./path
      dockerfile: Dockerfile
    image: image-name:tag
    container_name: container-name
    ports:
      - "3000:3000"
    environment:
      - VARIABLE=value
    volumes:
      - ./local:/container/path
      - named-volume:/data
    depends_on:
      - other-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  named-volume:
```

---

## Useful Docker Resources

- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Troubleshooting](https://docs.docker.com/config/containers/troubleshoot/)

---

## Quick Command Reference (Print This!)

```
# Essential Commands:
docker-compose up -d              Start all services
docker-compose stop               Stop all services
docker-compose ps                 Check status
docker-compose logs -f            View logs
docker-compose restart            Restart services
docker-compose down               Remove containers
docker-compose exec <svc> sh      Shell access

# Database:
docker-compose exec postgres psql -U postgres
docker-compose exec mongo mongosh
docker-compose exec redis redis-cli

# Troubleshooting:
docker-compose build --no-cache   Rebuild
docker system prune -a            Clean up
docker-compose down -v            Reset everything
```

---

✅ **Ready to use Docker?** Run: `docker-compose up -d` 🚀
