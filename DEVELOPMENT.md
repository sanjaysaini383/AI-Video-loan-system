# Video Loan System - Development Guide

## Quick Setup

```bash
# Using setup script (recommended)
./setup.sh          # Linux/Mac
setup.bat          # Windows
```

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your keys
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Frontend Development
```bash
cd frontend
npm run dev
```

## Service Architecture

### Request Flow
1. User accesses frontend (React app)
2. Frontend communicates with API Gateway
3. API Gateway routes to appropriate microservices
4. Services communicate via WebSocket, HTTP, or message queues
5. Jobs are processed asynchronously via BullMQ

### Service Interdependencies

```
API Gateway (3000)
├── Session Service (3001) - WebRTC signaling
├── Media Service (3002) - Video storage
├── STT Service (3003) - Transcription
├── KYC Service (3004) - Identity checks
├── Risk Service (3005) - ML scoring
├── Vision Service (3006) - Age detection
├── LLM Service (3007) - Conversation analysis
├── Offer Service (3008) - Loan generation
└── Audit Service (3009) - Logging
```

## Development Workflow

### Adding a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes in appropriate service(s)**
   ```bash
   cd services/api-gateway
   # Edit src files
   ```

3. **Update types if needed**
   ```bash
   # Edit shared/models/types.ts
   ```

4. **Test locally**
   ```bash
   npm run test
   npm run lint
   ```

5. **Submit PR**
   ```bash
   git push origin feature/new-feature
   ```

## Database Management

### PostgreSQL

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d video_loan_db

# Run migrations (if using Prisma)
npm run db:migrate

# Reset database
npm run db:reset
```

### MongoDB

```bash
# Connect to MongoDB
docker-compose exec mongo mongosh

# Access database
use video_loan_system
```

### Redis

```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Monitor real-time commands
docker-compose exec redis redis-cli monitor
```

## Debugging

### View Service Logs
```bash
docker-compose logs -f [service-name]
docker-compose logs -f api-gateway
docker-compose logs -f risk-service
```

### Attach Debugger (Node.js)

1. Add debugger flag to package.json
   ```json
   "dev": "node --inspect=0.0.0.0:9229 src/index.ts"
   ```

2. Open Chrome DevTools: `chrome://inspect`

### Common Issues

**Port already in use:**
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :3000   # Windows
```

**Docker out of disk space:**
```bash
docker system prune -a
```

## Performance Optimization

### Database Indexes
- Ensure indexes on frequently queried fields
- Monitor slow queries

### Caching
- Use Redis for session data
- Cache API responses

### Job Queues
- Monitor queue depth
- Adjust worker concurrency

## Security Checklist

- [ ] API keys in .env (never committed)
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Database migrations tracked
- [ ] Secrets not logged

## Deployment

### Docker Build
```bash
docker-compose build
```

### Kubernetes (Future)
```bash
./deploy-k8s.sh
```

## Monitoring & Observability

### Metrics to Track
- Request latency
- Error rates
- Video processing time
- ML model accuracy
- Queue depth

### Logging
- Use structured logging (pino for Node, logging for Python)
- Log correlation IDs for tracing

## Testing Strategy

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (future)
npm run test:e2e
```

## Troubleshooting

### Services won't start
1. Check Docker is running
2. Check ports aren't already in use
3. Check environment variables
4. Review docker-compose logs

### Database connection errors
1. Verify DATABASE_URL in .env
2. Check PostgreSQL is running
3. Verify credentials

### LLM API errors
1. Check API keys are valid
2. Check API rate limits
3. Verify network connectivity

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

Happy coding! 🚀
