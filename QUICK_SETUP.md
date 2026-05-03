# 🚀 Complete Setup Guide - Video Loan System

## ⏱️ Total Setup Time: ~30-45 minutes

This guide will walk you through **every single step** to get the project running locally.

---

## 📋 What You'll Need

### Prerequisites (Must Have)
- ✅ Windows 10+, Mac, or Linux
- ✅ Git installed
- ✅ Node.js 18+ ([Download](https://nodejs.org))
- ✅ Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- ✅ VS Code or any code editor

### Free Services (Just Get Accounts)
- ✅ NeonDB Account (Free PostgreSQL) - 5 minutes
- ✅ Anthropic Claude API Key (Free $5 credits) - 5 minutes

**Total time to get credentials: ~10 minutes**

---

## 📝 Step 1: Get Your API Keys (5 minutes)

### 1.1 PostgreSQL Database - NeonDB

1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** (free tier available)
3. Create an account
4. Once logged in, click **"New Project"**
5. Copy your **Connection String** (looks like: `postgresql://user:password@ep-xxxxx.neon.tech/neondb`)
6. Save it - you'll need it next

**Your connection string:**
```
DATABASE_URL=postgresql://...copy_from_neon...
```

### 1.2 AI/LLM API - Anthropic Claude (Recommended)

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Click **"Sign Up"**
3. Create an account
4. Go to **"API Keys"** section
5. Click **"Create Key"**
6. Copy the API key

**Your API key:**
```
ANTHROPIC_API_KEY=sk-ant-...copy_from_console...
```

### 1.3 Redis - Use Docker (Local)

No account needed! Docker will handle it automatically.

### 1.4 MongoDB - Use Docker (Local)

No account needed! Docker will handle it automatically.

---

## 💻 Step 2: Clone & Setup Project (10 minutes)

### 2.1 Clone the Repository

```bash
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git
cd AI-Video-loan-system
```

### 2.2 Create Your `.env` File

```bash
# Copy the example file
copy .env.example .env
# On Mac/Linux: cp .env.example .env
```

### 2.3 Edit `.env` File

Open `.env` in your editor and add ONLY these required fields:

```env
# 1. Database - Paste your NeonDB connection string
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/neondb

# 2. Redis - Leave as is (Docker will run locally)
REDIS_URL=redis://localhost:6379

# 3. MongoDB - Leave as is (Docker will run locally)
MONGODB_URI=mongodb://localhost:27017/video_loan_system

# 4. AI API - Paste your Anthropic key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# 5. JWT Secret - Generate one:
# Run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output here:
JWT_SECRET=your_generated_secret_here_32_characters_minimum

# 6. Keep these as default (ports for services)
JWT_EXPIRY=24h
OTP_EXPIRY=5m
NODE_ENV=development
LOG_LEVEL=info

# 7. Keep these as default (loan policies)
MIN_LOAN_AMOUNT=10000
MAX_LOAN_AMOUNT=500000
MIN_AGE=18
MAX_AGE=65

# 8. Service Ports - Keep all these as is
API_GATEWAY_PORT=3000
SESSION_SERVICE_PORT=3001
MEDIA_SERVICE_PORT=3002
STT_SERVICE_PORT=3003
KYC_SERVICE_PORT=3004
RISK_SERVICE_PORT=3005
VISION_SERVICE_PORT=3006
LLM_SERVICE_PORT=3007
OFFER_SERVICE_PORT=3008
AUDIT_SERVICE_PORT=3009
```

**Save the file.**

---

## 🐳 Step 3: Start Docker Services (15 minutes)

### 3.1 Make Sure Docker is Running

- **Windows/Mac**: Open Docker Desktop from Start Menu / Applications
- **Linux**: Run `sudo systemctl start docker`
- Wait 2-3 minutes for Docker to fully start

### 3.2 Start All Services

```bash
# Navigate to project folder (if not already there)
cd AI-Video-loan-system

# Start all services with Docker
docker-compose up -d

# Check if everything started (should show "Up" status)
docker-compose ps
```

**Output should show:**
```
CONTAINER ID   IMAGE                          COMMAND                  STATUS
...            postgres:15-alpine              "docker-entrypoint..."  Up 2 minutes
...            mongo:7                        "mongod"                 Up 2 minutes  
...            redis:7-alpine                 "redis-server"           Up 2 minutes
...            video-loan/api-gateway         "npm run dev"            Up 1 minute
...            video-loan/session-service     "npm run dev"            Up 1 minute
... (and more services)
```

### 3.3 Wait for Services to Be Ready

```bash
# Check logs (wait until you see "running on port" messages)
docker-compose logs -f api-gateway
```

Press `Ctrl+C` when you see:
```
🚀 API Gateway running on port 3000
```

---

## 🔗 Step 4: Verify Everything Works (5 minutes)

### 4.1 Check Database Connection

```bash
# Test PostgreSQL connection
curl http://localhost:3000/health
```

Should return: `{"status": "API Gateway is running"}`

### 4.2 Check All Services

```bash
# API Gateway
curl http://localhost:3000/health

# Session Service
curl http://localhost:3001/health

# Media Service
curl http://localhost:3002/health

# STT Service
curl http://localhost:3003/health

# KYC Service
curl http://localhost:3004/health

# Risk Service
curl http://localhost:3005/health

# Vision Service
curl http://localhost:3006/health

# LLM Service
curl http://localhost:3007/health

# Offer Service
curl http://localhost:3008/health

# Audit Service
curl http://localhost:3009/health
```

All should return `{"status": "Service is running"}`

---

## 🎨 Step 5: Setup Frontend (5 minutes)

### 5.1 Install Frontend Dependencies

```bash
# Open a NEW terminal window/tab
cd frontend
npm install
```

### 5.2 Start Frontend Dev Server

```bash
# In the frontend directory
npm run dev
```

### 5.3 Open in Browser

Open: **http://localhost:5173**

You should see the loan application UI!

---

## 📊 What's Running Now?

### Services Running:

| Service | Port | Status |
|---------|------|--------|
| Frontend | 5173 | ✅ Running |
| API Gateway | 3000 | ✅ Running |
| Session Service | 3001 | ✅ Running |
| Media Service | 3002 | ✅ Running |
| STT Service | 3003 | ✅ Running |
| KYC Service | 3004 | ✅ Running |
| Risk Service | 3005 | ✅ Running |
| Vision Service | 3006 | ✅ Running |
| LLM Service | 3007 | ✅ Running |
| Offer Service | 3008 | ✅ Running |
| Audit Service | 3009 | ✅ Running |

### Databases Running:

| Database | Port | Status |
|----------|------|--------|
| PostgreSQL (NeonDB) | 5432 | ✅ Connected |
| MongoDB | 27017 | ✅ Running |
| Redis | 6379 | ✅ Running |

---

## 🧪 Step 6: Test the Application Flow

### 6.1 Create a Session

```bash
# POST request to create a video session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "firstName": "John",
    "lastName": "Doe",
    "employmentStatus": "employed",
    "monthlyIncome": 50000,
    "loanPurpose": "personal"
  }'
```

Response:
```json
{
  "sessionId": "session_abc123",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 6.2 Generate Loan Offer

```bash
# Generate an offer for the session
curl -X POST http://localhost:3008/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_abc123",
    "userId": "user_123",
    "riskBand": "low"
  }'
```

### 6.3 View Audit Logs

```bash
# Get all logs for a session
curl http://localhost:3009/logs/session_abc123
```

---

## ⚙️ Useful Commands for Development

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f service-name

# Restart a specific service
docker-compose restart api-gateway

# Check status
docker-compose ps

# Remove volumes (reset databases)
docker-compose down -v
```

### Database Access

```bash
# PostgreSQL - Connect to database
docker-compose exec postgres psql -U postgres -d video_loan_db

# MongoDB - Connect to database
docker-compose exec mongo mongosh

# Redis - Check data
docker-compose exec redis redis-cli ping
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

### Node.js Services

```bash
# Install dependencies
npm install

# Start in development (with auto-reload)
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

---

## 🐛 Troubleshooting

### Issue: "Docker daemon is not running"

**Solution:**
- Open Docker Desktop from your Start Menu / Applications
- Wait 2-3 minutes for it to fully start

### Issue: "Port 3000 already in use"

**Solution (Windows):**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Solution (Mac/Linux):**
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: "Cannot connect to database"

**Solution:**
1. Check `DATABASE_URL` in `.env` is correct (copy from NeonDB dashboard)
2. Check you're connected to internet (NeonDB is cloud-hosted)
3. Try: `docker-compose restart postgres`

### Issue: "Services starting but not responding"

**Solution:**
```bash
# Check logs
docker-compose logs api-gateway

# Wait 10 seconds and try again (services need time to start)
# Check health
curl http://localhost:3000/health
```

### Issue: "MongoDB connection error"

**Solution:**
```bash
# Make sure MongoDB container is running
docker-compose ps mongo

# If not running, restart it
docker-compose restart mongo

# Try connecting
docker-compose exec mongo mongosh
```

### Issue: "Redis connection refused"

**Solution:**
```bash
# Restart Redis
docker-compose restart redis

# Verify it's running
docker-compose logs redis
```

---

## 📚 Next Steps - What to Do Now

### 1. Explore the API

Go through the [API.md](./API.md) to understand all available endpoints.

### 2. Read the Documentation

- [README.md](./README.md) - Architecture overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [API.md](./API.md) - API reference

### 3. Start Development

Check out the microservices in `services/` folder and start customizing.

### 4. Add More API Keys (Optional)

- **AWS S3** - For video storage
- **Twilio** - For SMS/OTP
- **Deepgram** - For better speech-to-text

---

## 🎯 Common Development Tasks

### Adding a New Endpoint

1. Edit the service file in `services/api-gateway/src/index.ts`
2. Save file (auto-reload happens)
3. Test with curl or Postman

### Adding a New Database Field

1. Edit `config/prisma.schema`
2. Run migrations: `npm run db:migrate`
3. Use in your code

### Debugging Services

```bash
# View logs for a specific service
docker-compose logs -f api-gateway

# View logs for all services
docker-compose logs -f

# Follow logs in real-time
docker-compose logs -f --tail=50
```

---

## ✅ Checklist - Have You Done These?

- [ ] Downloaded Node.js 18+
- [ ] Downloaded Docker Desktop
- [ ] Created NeonDB account and got connection string
- [ ] Created Anthropic API key
- [ ] Cloned the repository
- [ ] Created `.env` file with your keys
- [ ] Started Docker: `docker-compose up -d`
- [ ] Installed frontend: `cd frontend && npm install`
- [ ] Started frontend: `npm run dev`
- [ ] Opened http://localhost:5173 in browser
- [ ] Tested API endpoints with curl
- [ ] Read API.md for more endpoints

---

## 🆘 Still Having Issues?

1. **Check Docker is running:** Open Docker Desktop
2. **Check .env file:** Make sure all paths are correct
3. **Check logs:** `docker-compose logs service-name`
4. **Restart services:** `docker-compose down` then `docker-compose up -d`
5. **Clear cache:** `docker-compose down -v` (WARNING: Deletes all data)

---

## 📞 Quick Reference

| What | Command |
|------|---------|
| Start everything | `docker-compose up -d` |
| Stop everything | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Check status | `docker-compose ps` |
| Frontend dev | `cd frontend && npm run dev` |
| Test API | `curl http://localhost:3000/health` |

---

**You're all set! 🎉 Start developing!**
