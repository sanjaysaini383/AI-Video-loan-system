# 🚀 Complete Guide to Run Video-Based Loan System

## ✅ Pre-Requirements Checklist

- [x] Git installed and project cloned
- [x] Docker Desktop installed
- [x] All `.env` variables configured  
- [x] C: drive has **at least 5GB free space**
- [x] D: drive has space (196GB available)
- [x] Node.js 18+ (for local development)
- [x] Python 3.11 (for local development)

---

## 🔧 STEP 1: Clean System (Fix Storage Issue)

**C: Drive only had 112 MB free - this must be fixed first!**

```powershell
# Delete temp files to free up C: drive
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:WINDIR\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue

# Clean Docker completely
docker system prune -a -f --volumes

# Verify free space (need at least 5GB on C:)
Get-Volume
```

**Expected Output:** C: drive should show **5GB+ free space**

---

## 🐳 STEP 2: Start Docker Desktop

```powershell
# Method 1: From Windows Start Menu - Search "Docker Desktop" and click

# Method 2: From PowerShell
Start-Process "C:\Program Files\Docker\Docker\Docker.exe"

# Wait 2-3 minutes for Docker to fully start
Start-Sleep -Seconds 180

# Verify Docker is running
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
(empty list is fine - no containers running yet)
```

---

## 📁 STEP 3: Navigate to Project Directory

```powershell
cd d:\SF-Repos\video-loan-system

# Verify you're in the right place
ls docker-compose.yml
```

**Expected Output:**
```
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---           5/4/2026  11:28 AM           5234 docker-compose.yml
```

---

## 🔑 STEP 4: Verify .env Configuration

```powershell
# Check the .env file has all required variables
Get-Content .env
```

**Required Variables (should not be empty):**
- ✅ `DATABASE_URL` - PostgreSQL connection (local or cloud)
- ✅ `LLM_PROVIDER=groq` - LLM to use
- ✅ `GROQ_API_KEY` - Your Groq API key
- ✅ `JWT_SECRET` - 64-char secret
- ✅ `REDIS_URL` - Redis connection
- ✅ `DEEPGRAM_API_KEY` - Speech-to-text key

**If any are missing**, edit `.env` and add them:
```
notepad .env
```

---

## 🔨 STEP 5: Build and Start All Docker Services

```powershell
# Clean up any old containers and volumes
docker-compose down -v

# Build all images and start containers
# ⏱️ This will take 5-10 minutes (first time)
docker-compose up -d --build
```

**What's Happening:**
- Building 10 Docker images for microservices
- Starting 3 database containers (PostgreSQL, MongoDB, Redis)
- Starting 7 Node.js service containers
- Starting 3 Python service containers

---

## ⏳ STEP 6: Wait for All Services to Be Healthy

```powershell
# Check container status every 30 seconds
# Press Ctrl+C to stop checking
while($true) {
    Clear-Host
    docker-compose ps
    Start-Sleep -Seconds 30
}
```

**Expected Output (all should be "Up" after 2-3 minutes):**
```
NAME                          IMAGE                             STATUS
video-loan-postgres           postgres:15-alpine                Up (healthy)
video-loan-mongo              mongo:7.0                         Up (healthy)
video-loan-redis              redis:7-alpine                    Up (healthy)
video-loan-api-gateway        video-loan-system-api-gateway     Up
video-loan-session-service    video-loan-system-session-service Up
video-loan-media-service      video-loan-system-media-service   Up
video-loan-stt-service        video-loan-system-stt-service     Up
video-loan-kyc-service        video-loan-system-kyc-service     Up
video-loan-offer-service      video-loan-system-offer-service   Up
video-loan-audit-service      video-loan-system-audit-service   Up
video-loan-risk-service       video-loan-system-risk-service    Up
video-loan-vision-service     video-loan-system-vision-service  Up
video-loan-llm-service        video-loan-system-llm-service     Up
```

**If any container is "Exited":**
```powershell
# Check logs for that service
docker-compose logs api-gateway    # Replace with service name
```

---

## ✅ STEP 7: Verify All Services Are Running

Test each service's health endpoint:

```powershell
# Test API Gateway
curl http://localhost:3000/health
# Expected: {"status":"API Gateway is running"}

# Test Session Service
curl http://localhost:3001/health
# Expected: {"status":"Session Service is running"}

# Test Vision Service (AI/ML)
curl http://localhost:3006/health
# Expected: {"status":"Vision Service running"}

# Test LLM Service (AI Conversation)
curl http://localhost:3007/health
# Expected: {"status":"LLM Service running"}

# Test Risk Service
curl http://localhost:3005/health
# Expected: {"status":"Risk Service running"}

# Test Audit Service
curl http://localhost:3009/health
# Expected: {"status":"Audit Service running"}
```

**If a health check fails:**
```powershell
# View logs for that service
docker-compose logs -f api-gateway    # Replace service name
```

---

## 📊 STEP 8: Check Databases

### PostgreSQL
```powershell
# Connect to PostgreSQL
docker exec -it video-loan-postgres psql -U postgres -d video_loan_db

# List tables (inside psql prompt)
\dt

# Exit
\q
```

### MongoDB
```powershell
# Connect to MongoDB
docker exec -it video-loan-mongo mongosh -u admin -p password

# List databases
show databases

# Exit
exit
```

### Redis
```powershell
# Check Redis
docker exec -it video-loan-redis redis-cli ping
# Expected: PONG
```

---

## 🌐 STEP 9: Access Frontend (Optional)

### Option A: Development Server (Hot Reload)
```powershell
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Option B: Production Build
```powershell
cd frontend
npm install
npm run build
npm run preview
# Runs on http://localhost:5173 (preview mode)
```

---

## 📡 STEP 10: API Endpoints Guide

### Main Gateway (localhost:3000)
```
GET    /health                    - Service health
GET    /api/sessions              - List sessions
POST   /api/sessions              - Create session
```

### Services (Direct Access)
```
Port 3001 - Session Service (WebRTC signaling)
Port 3002 - Media Service (Video upload)
Port 3003 - STT Service (Speech-to-text)
Port 3004 - KYC Service (Identity verification)
Port 3005 - Risk Service (ML risk scoring)
Port 3006 - Vision Service (Age, liveness detection)
Port 3007 - LLM Service (Conversation analysis)
Port 3008 - Offer Service (Loan offers)
Port 3009 - Audit Service (Compliance logging)
```

### Databases
```
PostgreSQL: localhost:5432
MongoDB:    localhost:27017
Redis:      localhost:6379
```

---

## 🛑 STEP 11: Stop Everything

```powershell
# Stop all containers (keeps volumes/data)
docker-compose down

# Stop all containers AND delete volumes (fresh restart)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### ❌ Containers Keep Crashing
```powershell
# Check logs
docker-compose logs api-gateway

# Ensure .env variables are set
cat .env | grep -E "DATABASE_URL|GROQ_API_KEY|JWT_SECRET"

# Rebuild with fresh cache
docker-compose down -v
docker system prune -a -f
docker-compose up -d --build
```

### ❌ Storage/Disk Space Error
```powershell
# Free up C: drive
Remove-Item -Path "$env:TEMP\*" -Recurse -Force
docker system prune -a -f --volumes

# Check space
Get-Volume
```

### ❌ Port Already in Use (3000, 3001, etc.)
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with the process ID)
taskkill /PID 1234 /F

# Or restart Docker Desktop
Stop-Process -Name "Docker Desktop" -Force
Start-Process "C:\Program Files\Docker\Docker\Docker.exe"
```

### ❌ MongoDB Health Check Fails
```powershell
# MongoDB takes longer to start (40+ seconds)
# Wait longer before checking status:
Start-Sleep -Seconds 60
docker-compose ps
```

### ❌ `npm run dev` Fails
```powershell
# May need TypeScript compilation
docker exec -it video-loan-api-gateway npm run build

# Or check for missing dependencies
docker exec -it video-loan-api-gateway npm install
```

---

## 📋 Project Architecture

```
┌─────────────────────────────────────────┐
│        React Frontend (5173)            │
│   OnboardingFlow, VideoCall, Offers     │
└────────────┬────────────────────────────┘
             │ Socket.io + REST APIs
┌────────────▼────────────────────────────┐
│     API Gateway (3000) - Express        │
│   Authentication, Routing, Rate Limit   │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┬──────────┬──────────┬──────────┐
    │        │        │          │          │          │
    ▼        ▼        ▼          ▼          ▼          ▼
Session  Media    STT (Deepgram) KYC      Offer    Audit
(3001)   (3002)   (3003)        (3004)   (3008)   (3009)
WebRTC   Upload   Groq LLM                        MongoDB
Socket   S3       Speech-Text
    │        │        │          │          │          │
    └────────┼────────┴──────────┼──────────┴──────────┘
             │                   │
    ┌────────▼───────┐  ┌────────▼────────┐
    │  Vision (3006) │  │  Risk (3005)    │
    │  MediaPipe     │  │  ML Scoring     │
    │  Age/Liveness  │  │  Fraud Detection│
    └────────────────┘  └────────┬────────┘
                                  │
            ┌─────────┬───────────┴─────────┬──────────┐
            │         │                     │          │
            ▼         ▼                     ▼          ▼
        PostgreSQL  MongoDB              Redis        LLM Service
        (5432)      (27017)            (6379)        (3007)
        Users       Audit/Logs         Cache/Queue   Groq/Ollama
        KYC         Transcripts        Sessions      Analysis
        Offers      LLM Output
```

---

## 🎯 Quick Testing Workflow

```powershell
# 1. Check all running
docker-compose ps

# 2. Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3006/health
curl http://localhost:3007/health

# 3. View logs for any service
docker-compose logs -f api-gateway

# 4. Access frontend
Start-Process "http://localhost:5173"

# 5. Access PostgreSQL
docker exec -it video-loan-postgres psql -U postgres

# 6. Stop everything
docker-compose down
```

---

## 📚 Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Cloud PostgreSQL | Main database |
| `LLM_PROVIDER` | `groq` | AI conversation provider |
| `GROQ_API_KEY` | Your key | LLM API access |
| `JWT_SECRET` | 64-char hex | Authentication token secret |
| `REDIS_URL` | `redis://redis:6379` | Cache & session storage |
| `MONGODB_URI` | `mongodb://...` | Audit log storage |
| `DEEPGRAM_API_KEY` | Your key | Speech-to-text API |
| `VISION_PROVIDER` | `mediapipe` | Age/liveness detection (FREE) |

---

## 🎉 Success Criteria

✅ All 13 containers show "Up" status  
✅ All health endpoints return 200 OK  
✅ Can connect to PostgreSQL, MongoDB, Redis  
✅ Frontend loads at localhost:5173 (optional)  
✅ Can send API requests to localhost:3000  
✅ Logs show no errors (warnings are OK)  

**Congratulations! Your system is running! 🚀**

---

## 🔗 Useful Commands

```powershell
# View real-time logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api-gateway

# Execute command in container
docker exec -it video-loan-api-gateway ls -la

# Rebuild specific service
docker-compose build api-gateway

# Restart all services
docker-compose restart

# View volumes
docker volume ls

# Remove all Docker data (CAUTION!)
docker system prune -a -f --volumes
```

---

## 📞 Support

For issues, check:
1. **docker-compose logs** - Most issues show here
2. **Storage space** - Must have 5GB+ free on C:
3. **.env file** - All keys must be filled
4. **Docker Desktop** - Must be running
5. **Port conflicts** - Check if ports are already in use

Good luck! 🎊
