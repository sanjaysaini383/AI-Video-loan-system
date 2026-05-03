# 🚀 Complete Project Setup Guide

## Prerequisites

### Required Software
Before starting, ensure you have installed:

1. **Git** (v2.30+)
   - [Download Git](https://git-scm.com/)
   - Verify: `git --version`

2. **Node.js** (v18+)
   - [Download Node.js](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

3. **Python** (v3.11+)
   - [Download Python](https://www.python.org/)
   - Verify: `python --version`
   - Windows: Make sure to check "Add Python to PATH" during installation

4. **Docker & Docker Compose**
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Verify: `docker --version` and `docker-compose --version`
   - Start Docker Desktop before proceeding

5. **Visual Studio Code** (Optional but recommended)
   - [Download VS Code](https://code.visualstudio.com/)

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git

# Navigate to project
cd AI-Video-loan-system

# Verify you're in the right directory
ls  # Linux/Mac
dir # Windows
```

Expected files: `docker-compose.yml`, `README.md`, `package.json`, etc.

---

## Step 2: Environment Configuration

### 2.1 Create .env File

```bash
# Copy the example to create your own .env
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example -Destination .env
```

### 2.2 Get Required API Keys

You need to populate `.env` with various API keys. Here's how to get each one:

#### **AWS S3 Configuration** (For Video Storage)
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign in or create account
3. Search for "IAM" → Click "Users"
4. Click "Create user" → Name: `video-loan-app`
5. Click "Next" → Select "Attach policies directly"
6. Search and select: `AmazonS3FullAccess`
7. Click "Create user"
8. Click on the user → "Security credentials" tab
9. Click "Create access key" → Choose "Application running outside AWS"
10. Copy:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
11. Create S3 bucket:
    - Go to S3 → "Create bucket"
    - Name: `video-loan-recordings` (or any unique name)
    - Click "Create bucket"

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA2XXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=video-loan-recordings
```

#### **OpenAI API Key** (For STT - Speech to Text)
1. Go to [OpenAI API](https://platform.openai.com/)
2. Sign in or create account
3. Click profile icon → "API keys"
4. Click "Create new secret key"
5. Copy and save (you won't see it again!)

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

#### **Anthropic Claude API Key** (For LLM Analysis)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create account
3. Click "API Keys" on the left
4. Click "Create Key"
5. Copy the key

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

#### **Deepgram API Key** (For STT - Alternative)
1. Go to [Deepgram Console](https://console.deepgram.com/)
2. Sign in or create account
3. Click "API Keys" → "Create a new API Key"
4. Copy the key

```env
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

#### **Twilio** (For SMS/OTP - Optional)
1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign in or create account
3. Copy:
   - Account SID
   - Auth Token
4. Get a Twilio Phone Number or use existing

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### **Security Keys** (Generate Random Strings)
```bash
# Generate JWT secret (use any random string or online generator)
# Option 1: Use online tool: https://www.random.org/strings/
# Option 2: Command line:

# Linux/Mac:
openssl rand -hex 32

# Windows PowerShell:
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[System.Convert]::ToHexString($bytes)
```

```env
JWT_SECRET=your_random_32_character_hex_string_here
```

### 2.3 Complete .env File Template

```env
# ============ DATABASE CONFIGURATION ============
DATABASE_URL=postgresql://postgres:password@postgres:5432/video_loan_db
MONGODB_URI=mongodb://admin:password@mongo:27017/video_loan_system
REDIS_URL=redis://redis:6379

# ============ AWS CONFIGURATION ============
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA2XXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=video-loan-recordings

# ============ JWT & AUTHENTICATION ============
JWT_SECRET=your_random_hex_string_here
JWT_EXPIRY=24h
OTP_EXPIRY=5m

# ============ AI/ML SERVICES ============
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# ============ SMS/NOTIFICATIONS (Optional) ============
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
MSG91_AUTH_KEY=your_msg91_key

# ============ SERVICE PORTS ============
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

# ============ ENVIRONMENT ============
NODE_ENV=development
LOG_LEVEL=info

# ============ WEBRTC CONFIGURATION ============
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVER_URL=turn:your.turn.server.com:3478
TURN_USERNAME=your_turn_username
TURN_PASSWORD=your_turn_password

# ============ LIVENESS & AGE DETECTION ============
LIVENESS_CONFIDENCE_THRESHOLD=0.85
AGE_ESTIMATION_CONFIDENCE_THRESHOLD=0.80

# ============ LOAN POLICY ============
MIN_LOAN_AMOUNT=10000
MAX_LOAN_AMOUNT=500000
MIN_AGE=18
MAX_AGE=65
```

**⚠️ Important:** Never commit `.env` to Git! It's already in `.gitignore`.

---

## Step 3: Docker Setup

### 3.1 Verify Docker Installation

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10+

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 1.29+

# Start Docker Desktop (Windows/Mac)
# For Linux, Docker usually starts automatically
```

### 3.2 Build Docker Images

```bash
cd d:\SF-Repos\video-loan-system

# Build all images
docker-compose build

# This will take 5-10 minutes on first run
# Output: Successfully built xxxxxxx
```

### 3.3 Start All Services

```bash
# Start all containers in background
docker-compose up -d

# Expected output:
# Creating video-loan-postgres ... done
# Creating video-loan-mongo ... done
# Creating video-loan-redis ... done
# Creating video-loan-api-gateway ... done
# ... (and all other services)
```

### 3.4 Verify Services Are Running

```bash
# Check all containers
docker-compose ps

# Expected: All containers show "Up"
# CONTAINER ID   IMAGE                              STATUS
# abc123         video-loan-system_postgres         Up 2 minutes
# def456         video-loan-system_mongo            Up 2 minutes
# ... (and all others)
```

### 3.5 View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f postgres
docker-compose logs -f mongo
docker-compose logs -f redis

# Press Ctrl+C to exit logs
```

---

## Step 4: Install Dependencies

### 4.1 Node.js Dependencies

```bash
# Install root dependencies
npm install

# This installs dependencies for all services (monorepo setup)
# Takes 5-10 minutes
```

### 4.2 Frontend Dependencies

```bash
# Navigate to frontend
cd frontend

# Install frontend dependencies
npm install

# Go back
cd ..
```

---

## Step 5: Database Setup

### 5.1 PostgreSQL Migrations (If using Prisma)

```bash
# Generate Prisma client
npx prisma generate

# Create database schema
npx prisma db push

# View database GUI (optional)
npx prisma studio

# This opens http://localhost:5555
```

### 5.2 Verify Databases

#### **PostgreSQL**
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d video_loan_db

# In the psql prompt:
\dt          # List all tables
\l           # List databases
\q           # Quit
```

#### **MongoDB**
```bash
# Connect to MongoDB
docker-compose exec mongo mongosh

# In mongosh prompt:
show dbs                          # Show databases
use video_loan_system             # Switch database
show collections                  # Show collections
db.audit_logs.count()             # Count documents
exit                              # Exit
```

#### **Redis**
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping

# Expected: PONG
```

---

## Step 6: Run the Project

### 6.1 Option A: Run Everything with Docker (Recommended for beginners)

```bash
# All services run inside Docker
# Just make sure containers are running
docker-compose ps

# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health
# ... etc
```

### 6.2 Option B: Run Services Individually (For Development)

#### **Terminal 1 - API Gateway**
```bash
cd services/api-gateway
npm run dev
# Server running on port 3000
```

#### **Terminal 2 - Session Service**
```bash
cd services/session-service
npm run dev
# Server running on port 3001
```

#### **Terminal 3 - Media Service**
```bash
cd services/media-service
npm run dev
# Server running on port 3002
```

#### **Terminal 4 - Risk Service (Python)**
```bash
cd services/risk-service

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run service
python -m uvicorn src.main:app --reload --port 3005
# Server running on port 3005
```

#### **Terminal 5 - Frontend**
```bash
cd frontend
npm run dev
# Development server on http://localhost:5173
```

### 6.3 Option C: Using the Quick Start Script

```bash
# Linux/Mac
./quick-start.sh

# Windows
.\quick-start.sh

# This starts everything automatically
```

---

## Step 7: Access the Application

### Running Services Ports

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | React Application |
| **API Gateway** | http://localhost:3000 | REST API Endpoint |
| **Session Service** | http://localhost:3001 | WebSocket Signaling |
| **Media Service** | http://localhost:3002 | Video Upload |
| **STT Service** | http://localhost:3003 | Speech-to-Text |
| **KYC Service** | http://localhost:3004 | Identity Verification |
| **Risk Service** | http://localhost:3005 | Risk Assessment |
| **Vision Service** | http://localhost:3006 | Age Detection |
| **LLM Service** | http://localhost:3007 | AI Analysis |
| **Offer Service** | http://localhost:3008 | Loan Offers |
| **Audit Service** | http://localhost:3009 | Audit Logging |
| **Prisma Studio** | http://localhost:5555 | Database GUI |

### Test Services

```bash
# Test API Gateway
curl http://localhost:3000/health

# Test Session Service
curl http://localhost:3001/health

# Test all services
for i in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009; do
  echo "Port $i:"
  curl http://localhost:$i/health
done
```

---

## Step 8: Database Access

### GUI Tools

#### **Prisma Studio** (PostgreSQL)
```bash
npx prisma studio
# Opens http://localhost:5555
# Visual database explorer
```

#### **MongoDB Compass** (MongoDB)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connection URI: `mongodb://admin:password@localhost:27017/video_loan_system`
3. Connect and explore collections

#### **Redis Commander** (Redis)
```bash
npm install -g redis-commander
redis-commander
# Opens http://localhost:8081
```

---

## Step 9: Sample API Calls

### Create Session
```bash
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

### Check Session Status
```bash
curl http://localhost:3000/api/sessions/session_abc123
```

### Generate Loan Offer
```bash
curl -X POST http://localhost:3008/offer/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_abc123",
    "userId": "user_123",
    "riskBand": "low"
  }'
```

---

## Step 10: Troubleshooting

### Issue: "Docker is not running"
```bash
# Solution: Start Docker Desktop or Docker daemon
# Windows/Mac: Open Docker Desktop application
# Linux: sudo systemctl start docker
```

### Issue: "Port already in use"
```bash
# Solution: Find and kill the process
# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Issue: "Module not found" error
```bash
# Solution: Reinstall dependencies
npm install
cd frontend && npm install && cd ..
```

### Issue: "PostgreSQL connection refused"
```bash
# Solution: Check database is running
docker-compose ps postgres

# If not running:
docker-compose start postgres

# Wait 10 seconds for it to be ready
sleep 10
```

### Issue: "ModuleNotFoundError" in Python services
```bash
# Solution: Install Python dependencies
cd services/risk-service
pip install -r requirements.txt

# Or for all Python services:
for dir in services/risk-service services/vision-service services/llm-service; do
  cd $dir
  pip install -r requirements.txt
  cd ../..
done
```

### Issue: "EADDRINUSE: address already in use"
```bash
# Solution: Use a different port or kill existing process
# In docker-compose.yml, change port:
# From: "3000:3000"
# To:   "3001:3000"
```

---

## Step 11: Common Commands

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec api-gateway npm test

# Restart specific service
docker-compose restart api-gateway
```

### NPM Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Git Commands
```bash
# Clone repository
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git

# Create new branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "Your message"

# Push to GitHub
git push origin feature/your-feature
```

---

## Step 12: Final Checklist

Before running the project, verify:

- [ ] Git installed and repository cloned
- [ ] Node.js v18+ installed
- [ ] Python 3.11+ installed
- [ ] Docker Desktop installed and running
- [ ] `.env` file created with all API keys
- [ ] `npm install` completed
- [ ] `docker-compose build` completed
- [ ] `docker-compose up -d` running
- [ ] All services show "Up" in `docker-compose ps`
- [ ] `http://localhost:5173` loads in browser

---

## Next Steps

1. **Start the frontend:** `cd frontend && npm run dev`
2. **Open browser:** `http://localhost:5173`
3. **Test the application:** Try creating a session
4. **Read documentation:** See [README.md](./README.md) and [API.md](./API.md)
5. **Start developing:** Create features in your own branch

---

## Getting Help

- **Read Documentation:** [README.md](./README.md), [DEVELOPMENT.md](./DEVELOPMENT.md), [API.md](./API.md)
- **Check Logs:** `docker-compose logs -f service-name`
- **Debug Issues:** [Troubleshooting Section](#step-10-troubleshooting)
- **GitHub Issues:** Report problems in repository

---

**Ready to start? Run: `docker-compose up -d` 🚀**
