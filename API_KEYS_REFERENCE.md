# 🔑 API Keys & Configuration Quick Reference

## ⚡ TL;DR - Minimum Setup

**You need ONLY these 2 things to run the project:**

1. **NeonDB Connection String** (PostgreSQL)
   - Sign up: https://neon.tech
   - Copy connection string

2. **Anthropic Claude API Key**
   - Sign up: https://console.anthropic.com
   - Create API key

**Total time: ~10 minutes**

---

## 📚 Complete API Keys List

### ✅ REQUIRED - Must Have

| Service | Where to Get | Example | Priority |
|---------|--------------|---------|----------|
| **PostgreSQL (NeonDB)** | https://neon.tech | `postgresql://user:pass@ep-xxx.neon.tech/neondb` | 🔴 Critical |
| **Redis** | Docker (built-in) | `redis://localhost:6379` | 🔴 Critical |
| **MongoDB** | Docker (built-in) | `mongodb://localhost:27017/video_loan_system` | 🔴 Critical |
| **Anthropic Claude** | https://console.anthropic.com | `sk-ant-xxxxx` | 🔴 Critical |
| **JWT Secret** | Generate locally | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 🔴 Critical |

### ⭕ OPTIONAL - Add Later

| Service | Where to Get | When Needed | Example |
|---------|--------------|-------------|---------|
| **AWS S3** | https://console.aws.amazon.com | Video storage | `AKIAIOSFODNN7EXAMPLE` |
| **Twilio** | https://www.twilio.com | SMS/OTP verification | `AC123456789abcdef` |
| **OpenAI** | https://platform.openai.com | Alternative to Claude | `sk-proj-xxxxx` |
| **Deepgram** | https://console.deepgram.com | Advanced speech-to-text | `key-xxxxx` |
| **MSG91** | https://www.msg91.com | SMS in India | `auth-key-xxxxx` |

---

## 🔴 REQUIRED Setup (10 minutes)

### Step 1: PostgreSQL via NeonDB (3 minutes)

**Why NeonDB?**
- ✅ Free tier: 3 projects, 0.5 GB storage
- ✅ Serverless PostgreSQL
- ✅ Pay-as-you-go after free tier
- ✅ Always on (no hibernation)

**How to set up:**

1. Go to https://neon.tech
2. Click "Sign Up"
3. Create account
4. Create new project
5. Copy **Connection String** from "Connection Details"

**Your `.env` entry:**
```env
DATABASE_URL=postgresql://neondb_owner:xxxpasswordxxx@ep-xxxxxx-pooler.us-east-2.neon.tech/neondb?sslmode=require
```

**Verify it works:**
```bash
# Connection will be tested when you start services
docker-compose up -d postgres
```

---

### Step 2: AI/LLM via Anthropic Claude (3 minutes)

**Why Anthropic Claude?**
- ✅ $5 free credits
- ✅ Better at reasoning than competitors
- ✅ 100K token context window
- ✅ Perfect for loan analysis

**How to set up:**

1. Go to https://console.anthropic.com
2. Click "Get Started" or "Sign Up"
3. Create account
4. Go to "API Keys" section
5. Click "Create Key"
6. Copy the key (starts with `sk-ant-`)

**Your `.env` entry:**
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Verify it works:**
```bash
# Test with curl (after project is running)
curl -X POST http://localhost:3007/analyze \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test", "transcript": "I want a loan"}'
```

---

### Step 3: JWT Secret (2 minutes)

**Generate a secure secret:**

```bash
# Run this in terminal/PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output to `.env`:**
```env
JWT_SECRET=your_copied_secret_here_32_characters_minimum
```

---

### Step 4: Redis & MongoDB (Auto - Docker handles it)

**No setup needed!** Docker Compose will:
- ✅ Start Redis automatically on localhost:6379
- ✅ Start MongoDB automatically on localhost:27017
- ✅ Create databases automatically

**In your `.env`:**
```env
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/video_loan_system
```

---

## 🟡 OPTIONAL Setup (For Production)

### AWS S3 - Video Storage

**When you need it:** When deploying to production for video storage

**How to set up:**

1. Go to https://console.aws.amazon.com/iam
2. Create IAM user with S3 permissions
3. Generate Access Key ID and Secret
4. Create S3 bucket

**Your `.env` entries:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=video-loan-recordings
```

**Cost:** 
- Free tier: 5 GB storage/month for first year
- After: ~$0.023 per GB

---

### Twilio - SMS/OTP Verification

**When you need it:** When you need to send SMS or OTP to customers

**How to set up:**

1. Go to https://www.twilio.com
2. Sign up (free $20 trial credit)
3. Get your Account SID and Auth Token
4. Get a Twilio phone number

**Your `.env` entries:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Cost:**
- Incoming SMS: $0.0075 per message
- Outgoing SMS: $0.0075-0.0150 per message

---

### OpenAI - Alternative AI Service

**When you need it:** If you want to use GPT instead of Claude

**How to set up:**

1. Go to https://platform.openai.com/api-keys
2. Create account or login
3. Go to API Keys section
4. Create new secret key
5. Copy key (starts with `sk-`)

**Your `.env` entry:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cost:**
- Free tier: $5 free credits, valid 3 months
- Pricing: ~$0.50 per 1M input tokens

---

### Deepgram - Advanced Speech-to-Text

**When you need it:** For better transcription accuracy

**How to set up:**

1. Go to https://console.deepgram.com
2. Create account
3. Go to API Keys
4. Create new key
5. Copy key

**Your `.env` entry:**
```env
DEEPGRAM_API_KEY=key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cost:**
- Free tier: 200 requests/month
- After: ~$0.0043 per minute

---

## 📋 Your .env File Template

```env
################################################################################
# 🔴 REQUIRED - Fill These In
################################################################################

# 1. Database - From NeonDB
DATABASE_URL=postgresql://neondb_owner:password@ep-xxxxx.neon.tech/neondb?sslmode=require

# 2. AI Service - From Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. JWT Secret - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_secret_here

################################################################################
# 🟢 AUTO-CONFIGURED - Leave As Is
################################################################################

REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/video_loan_system
JWT_EXPIRY=24h
OTP_EXPIRY=5m
NODE_ENV=development
LOG_LEVEL=info

MIN_LOAN_AMOUNT=10000
MAX_LOAN_AMOUNT=500000
MIN_AGE=18
MAX_AGE=65

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

################################################################################
# 🟡 OPTIONAL - Add These Later
################################################################################

# AWS S3 (For production video storage)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_S3_BUCKET=video-loan-recordings

# Twilio (For SMS/OTP)
# TWILIO_ACCOUNT_SID=ACxxxxx
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_PHONE_NUMBER=+1234567890

# WebRTC TURN Server (For production)
# TURN_SERVER_URL=turn:your.turn.server.com:3478
# TURN_USERNAME=your_username
# TURN_PASSWORD=your_password
```

---

## ⏱️ Setup Timeline

```
0-2 min    → Create NeonDB account, get connection string
2-5 min    → Create Anthropic account, get API key
5-8 min    → Generate JWT secret
8-10 min   → Fill in .env file
10+ min    → Start docker-compose, run project
```

---

## ✅ Verification Checklist

After filling `.env`, verify everything:

```bash
# 1. Start services
docker-compose up -d

# 2. Check all services running
docker-compose ps

# 3. Test API Gateway
curl http://localhost:3000/health

# 4. Check database connection
# This will show in logs
docker-compose logs postgres

# 5. Test LLM service (uses your Anthropic key)
curl http://localhost:3007/health
```

---

## 🆘 Common Issues

### "Invalid DATABASE_URL format"
- Copy the FULL connection string from NeonDB
- Make sure it includes `?sslmode=require` at the end

### "Anthropic API key not working"
- Make sure key starts with `sk-ant-`
- Check you copied the entire key
- Try creating a new key in console

### "Redis connection refused"
- Make sure Docker is running
- Run: `docker-compose restart redis`
- Verify: `docker-compose ps redis`

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :6379
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:6379 | xargs kill -9
```

---

## 💡 Pro Tips

1. **Keep `.env` secure** - Never commit it to Git
2. **Use environment-specific files** - `.env.development`, `.env.production`
3. **Rotate API keys regularly** - For security
4. **Use free tier services first** - Then upgrade as needed
5. **Monitor API usage** - Set billing alerts on AWS/Anthropic

---

## 📞 Quick Links

| Service | Link | Time |
|---------|------|------|
| NeonDB | https://neon.tech | 3 min |
| Anthropic | https://console.anthropic.com | 3 min |
| OpenAI | https://platform.openai.com | 3 min |
| AWS | https://console.aws.amazon.com | 5 min |
| Twilio | https://www.twilio.com | 5 min |
| Deepgram | https://console.deepgram.com | 3 min |

---

**Ready?** Fill in your `.env` and run: `docker-compose up -d` 🚀
