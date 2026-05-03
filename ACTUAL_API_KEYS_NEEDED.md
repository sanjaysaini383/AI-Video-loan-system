# 🎯 ACTUAL API Keys Needed - Based on Project Requirements

## 📌 The Reality Check

Based on the **Video-Based Digital Loan Origination System** problem statement, here's what you ACTUALLY need:

---

## 🔴 **ABSOLUTELY REQUIRED TO RUN PROJECT**

These are needed because the project features depend on them:

### 1. **PostgreSQL Database** (for user data & loans)
- **Required by:** KYC Service, Risk Service, Offer Service, Audit Service
- **Purpose:** Store users, applications, offers, consent records
- **What to use:** NeonDB (free cloud PostgreSQL)
- **Get it:** https://neon.tech
- **Your .env:**
```env
DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/neondb?sslmode=require
```
- **Status:** 🔴 CRITICAL - Project won't work without this

---

### 2. **Redis** (for real-time sessions & caching)
- **Required by:** Session Service, Media Service, all services
- **Purpose:** Store active video sessions, manage WebRTC connections
- **What to use:** Docker (already included)
- **Your .env:**
```env
REDIS_URL=redis://localhost:6379
```
- **Status:** 🔴 CRITICAL - Session management depends on this

---

### 3. **MongoDB** (for audit logs & transcripts)
- **Required by:** Audit Service, STT transcripts storage
- **Purpose:** Store video transcripts, audit logs, LLM analysis results
- **What to use:** Docker (already included)
- **Your .env:**
```env
MONGODB_URI=mongodb://localhost:27017/video_loan_system
```
- **Status:** 🔴 CRITICAL - Compliance/audit logging depends on this

---

### 4. **JWT Secret** (for authentication)
- **Required by:** API Gateway, all services
- **Purpose:** Sign and verify authentication tokens
- **Generate:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Your .env:**
```env
JWT_SECRET=your_generated_32_char_secret
```
- **Status:** 🔴 CRITICAL - No auth without this

---

### 5. **LLM API** (Choose ONE: Groq, Ollama, Claude, OpenAI, or Gemini)
- **Required by:** LLM Service (core requirement from problem statement)
- **Purpose:** "LLM-based Intelligence Layer" - Interpret conversation context, classify customers
- **Options Available:**
  - ⭐ **Groq** (30 requests/min - BEST for development)
  - 🏠 **Ollama** (Unlimited - runs locally, no API key)
  - 🔵 **Google Gemini** (60 requests/min)
  - ⚪ **OpenAI GPT** (3 requests/min on free tier)
  - 🐜 **Anthropic Claude** (1 request/min on free tier - not recommended)

**Recommendation:** Use **Groq** or **Ollama** to avoid rate limits

**Your .env** (choose one):
```env
# Option 1: Groq (RECOMMENDED - 30 req/min)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxx

# Option 2: Ollama (Local, unlimited)
LLM_PROVIDER=ollama
LOCAL_LLM_URL=http://localhost:11434

# Option 3: Gemini
LLM_PROVIDER=gemini
GEMINI_API_KEY=xxxxx

# Option 4: OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxx

# Option 5: Anthropic (Not recommended - slow rate limits)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**Getting Started:**
- **Groq:** https://console.groq.com/keys (2 min setup, free)
- **Ollama:** https://ollama.ai (10 min setup, free, local only)
- **Gemini:** https://aistudio.google.com/app/apikey (3 min setup, free)
- **OpenAI:** https://platform.openai.com/api-keys (2 min setup, $0.50/M tokens)

**Status:** 🔴 CRITICAL - Problem statement explicitly requires: "LLM-based Intelligence Layer"

**⚠️ Why NOT Anthropic for testing:**
- Only 1 request/minute = 60 requests/hour
- Each mistake means waiting 60 seconds for next test
- Groq gives 30 requests/minute (30x faster)
- Ollama gives unlimited (local) = no waiting

See [LLM_PROVIDERS_GUIDE.md](./LLM_PROVIDERS_GUIDE.md) for full comparison

---

### 6. **Speech-to-Text API** (Deepgram OR OpenAI Whisper)
- **Required by:** STT Service (core requirement from problem statement)
- **Purpose:** "Speech-to-Text (STT)" - Convert customer voice to text during video call
- **What to use:**
  - ✅ **Deepgram** (recommended - better quality)
  - OR OpenAI Whisper (alternative)
- **Get it:**
  - Deepgram: https://console.deepgram.com (200 free requests/month)
  - OpenAI: Same account as LLM
- **Your .env:**
```env
# Choose ONE:
DEEPGRAM_API_KEY=key-xxxxx  # OR use OPENAI_API_KEY above
```
- **Status:** 🔴 CRITICAL - Problem statement requires: "Speech-to-Text (STT) & Consent Capture"

---

### 7. **Age Estimation/Vision & Liveness Detection** (MediaPipe - FREE & Local!)
- **Required by:** Vision Service (core requirement from problem statement)
- **Purpose:** "Computer Vision-Based Age Estimation" - Detect age from video to prevent fraud
- **What to use:**
  - ✅ **MediaPipe** (RECOMMENDED - FREE, local, no API keys needed!)
  - OR AWS Rekognition (paid, but enterprise-grade)
  - OR Google Cloud Vision (paid)

**Best Choice: MediaPipe** ⭐
- **Cost:** FREE
- **Setup:** 2 minutes (just install package)
- **Accuracy:** 92-95%
- **Speed:** Real-time on CPU
- **Internet:** Not needed (runs locally)
- **API Keys:** None required

**Your .env:**
```env
# Using MediaPipe (RECOMMENDED - no keys needed)
VISION_PROVIDER=mediapipe
FACE_DETECTION_CONFIDENCE=0.5
AGE_ESTIMATION_ACCURACY=high

# Optional: If using AWS instead (not recommended for dev)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
# AWS_SECRET_ACCESS_KEY=xxxxx
```

**Installation:** Already included in Docker - MediaPipe is in `requirements.txt`

**Status:** 🟢 **NO API KEYS NEEDED** - Problem statement requires "Computer Vision-Based Age Estimation" (Now using free MediaPipe instead of AWS!)

---

## 🟡 **OPTIONAL BUT RECOMMENDED FOR PRODUCTION**

These make the system work better but can be skipped for local testing:

### 1. **AWS S3** (for video storage)
- **Required by:** Media Service
- **Purpose:** Store video recordings permanently
- **For local dev:** Just save to disk (can mock)
- **For production:** Use AWS S3
- **Your .env:**
```env
AWS_S3_BUCKET=video-loan-recordings
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```
- **Status:** 🟡 RECOMMENDED - Add when going to production

---

### 2. **Twilio** (for SMS/OTP)
- **Required by:** (Not in current codebase, but good for production)
- **Purpose:** Send OTP for phone verification
- **For local dev:** Mock/skip it
- **For production:** Get Twilio account
- **Your .env:**
```env
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```
- **Status:** 🟡 NICE TO HAVE - Add for production SMS

---

### 3. **TURN Server** (for WebRTC)
- **Required by:** Session Service (WebRTC)
- **Purpose:** Bypass NAT for video calls (only if behind firewall)
- **For local dev:** Not needed (same network)
- **For production:** Use Twilio TURN or self-hosted
- **Your .env:**
```env
TURN_SERVER_URL=turn:xxxxx
TURN_USERNAME=xxxxx
TURN_PASSWORD=xxxxx
```
- **Status:** 🟡 NEEDED FOR PRODUCTION - Skip for local

---

## 📊 **SUMMARY TABLE - What You Actually Need**

| API Key | Required? | Why | Cost | Time |
|---------|-----------|-----|------|------|
| PostgreSQL (NeonDB) | 🔴 YES | Database | Free $10 credit | 3 min |
| Redis | 🔴 YES | Sessions | Free (Docker) | 0 min |
| MongoDB | 🔴 YES | Audit logs | Free (Docker) | 0 min |
| JWT Secret | 🔴 YES | Auth | Free (Generate) | 1 min |
| **LLM (Groq/OpenAI)** | 🔴 YES | **Core feature** | Free | 2 min |
| **STT (Deepgram)** | 🔴 YES | **Core feature** | Free 200 requests | 2 min |
| **Vision (MediaPipe)** | 🟢 NO | **Free & Local!** | Free | 0 min |
| AWS S3 | 🟡 NO (dev) | Video storage | Free tier | Later |
| Twilio | 🟡 NO (dev) | SMS/OTP | Free $20 trial | Later |
| TURN Server | 🟡 NO (local) | WebRTC NAT | Free/Paid | Later |

**🎉 NEW: Vision Service now uses MediaPipe (FREE, LOCAL, NO API KEYS)**

---

## ✅ **MINIMUM .env TO RUN PROJECT** (Now Only 4 Items!)

```env
################################################################################
# 🔴 ABSOLUTELY REQUIRED (You MUST fill these 4 items only!)
################################################################################

# 1. NeonDB Connection String (from https://neon.tech) - 3 min
DATABASE_URL=postgresql://user:pass@ep-xxxxx.neon.tech/neondb?sslmode=require

# 2. Groq API Key (from https://console.groq.com/keys) - 2 min
# ⭐ BEST FOR DEVELOPMENT (30 req/min, free)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. Deepgram API Key (from https://console.deepgram.com) - 2 min
# Free: 200 requests/month
DEEPGRAM_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 4. JWT Secret (Generate locally) - 1 min
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_secret_here_32_chars_minimum

################################################################################
# 🟢 AUTO-CONFIGURED (Leave as is - Docker will handle)
################################################################################

REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/video_loan_system
JWT_EXPIRY=24h
OTP_EXPIRY=5m
NODE_ENV=development

################################################################################
# 🎉 VISION SERVICE (MediaPipe - NO CONFIG NEEDED!)
################################################################################

VISION_PROVIDER=mediapipe
FACE_DETECTION_CONFIDENCE=0.5
AGE_ESTIMATION_ACCURACY=high

# 💰 OPTIONAL: AWS (only for S3 video storage in production)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
# AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# AWS_S3_BUCKET=video-loan-recordings
```

**🎯 Total Setup Time: 10 minutes** (down from 15!) ✅

**Why AWS is no longer required:**
- Vision Service now uses **MediaPipe** (free, local)
- Age estimation works without any API keys
- Liveness detection included
- No internet needed, faster performance

**Prefer Ollama for LLM (unlimited, local)?** Replace step 2 with:
```env
LLM_PROVIDER=ollama
LOCAL_LLM_URL=http://localhost:11434
```
(Download from https://ollama.ai, then run `ollama run mistral`)

---

## 🔄 **ALTERNATIVE: Using Other LLM Providers**

### Using OpenAI instead of Groq:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your_key_here
```

### Using Anthropic (Not recommended - slow rate limits):
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

See [LLM_PROVIDERS_GUIDE.md](./LLM_PROVIDERS_GUIDE.md) for all options
LOG_LEVEL=info

# Loan Policies
MIN_LOAN_AMOUNT=10000
MAX_LOAN_AMOUNT=500000
MIN_AGE=18
MAX_AGE=65

# Service Ports
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

---

## 🚀 **Quick Setup - Just 4 APIs**

These 4 services need API keys (8 minutes total):

```
1. NeonDB        (3 min) → Get DATABASE_URL
2. Anthropic     (3 min) → Get ANTHROPIC_API_KEY
3. Deepgram      (2 min) → Get DEEPGRAM_API_KEY
4. AWS IAM       (3 min) → Get AWS credentials
```

Then you can run: `docker-compose up -d`

---

## 📌 **Why Each is Required**

| Feature | Service | API Key |
|---------|---------|---------|
| Customer data storage | KYC Service | PostgreSQL ✅ |
| Real-time video sessions | Session Service | Redis ✅ |
| Compliance/audit trail | Audit Service | MongoDB ✅ |
| User authentication | API Gateway | JWT Secret ✅ |
| **Conversation analysis** | LLM Service | Claude/OpenAI ✅ |
| **Voice transcription** | STT Service | Deepgram/Whisper ✅ |
| **Age verification** | Vision Service | AWS Rekognition ✅ |
| Loan offers | Offer Service | (Uses data from above) |
| Risk scoring | Risk Service | (Uses local ML) |

---

## ⚠️ **What NOT to Fill In**

These are OPTIONAL and you should SKIP them for now:

```env
# ❌ SKIP THESE (Optional for production)
# AWS_S3_BUCKET=video-loan-recordings  # For local dev, not needed
# TWILIO_ACCOUNT_SID=...               # Only if you need SMS
# TWILIO_AUTH_TOKEN=...                # Only if you need SMS
# TURN_SERVER_URL=...                  # Only if behind NAT firewall
```

---

## 🎯 **Your Action Plan**

```
Step 1: Create NeonDB account (3 min)
        → Get CONNECTION_STRING
        
Step 2: Create Anthropic account (3 min)
        → Get API_KEY
        
Step 3: Create Deepgram account (2 min)
        → Get API_KEY
        
Step 4: Create AWS account (3 min)
        → Get IAM credentials
        
Step 5: Generate JWT_SECRET (1 min)
        → Run node command
        
Step 6: Fill .env with above values
        → Save file
        
Step 7: Run docker-compose up -d
        → Project starts!
```

**Total time: 15 minutes** (Just getting credentials)

---

## ❌ **What Happens if You Skip Each**

| If You Skip | Error | Impact |
|------------|-------|--------|
| PostgreSQL | `ECONNREFUSED` | Users not saved, app crashes |
| Redis | Connection error | Sessions lost, real-time broken |
| MongoDB | Connection error | Audit logs fail, compliance broken |
| JWT Secret | Auth fails | Login won't work |
| Claude/OpenAI | API error | LLM analysis fails |
| Deepgram | Audio error | Transcription fails |
| AWS Rekognition | Vision error | Age detection fails |

---

**Bottom line:** You need **4 API keys** (Claude, Deepgram, AWS, NeonDB) + **1 generated secret** (JWT) = **5 things total**

All others are auto-configured by Docker. Ready to set up? 🚀
