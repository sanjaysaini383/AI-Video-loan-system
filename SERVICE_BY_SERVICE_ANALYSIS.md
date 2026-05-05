# Service-by-Service Issues & Status

## 📊 Service Health Dashboard

```
SERVICE                DOCKER   CODE IMPL   DB        STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. api-gateway         ❌ BAD   ✓ BASIC    ✓ Config   ⚠️ FAILING
2. session-service     ❌ BAD   ❌ TODO    ✓ Redis    ❌ BROKEN
3. media-service       ❌ BAD   ✓ BASIC    ⚠️ S3      ❌ BROKEN
4. stt-service         ❌ BAD   ❌ FAKE    ✓ Redis    ❌ FAKE DATA
5. kyc-service         ❌ BAD   ❌ FAKE    ✓ DB       ❌ FAKE DATA
6. offer-service       ❌ BAD   ✓ BASIC    ✓ DB       ✓ WORKING
7. audit-service       ❌ BAD   ✓ GOOD    ✓ MongoDB   ✓ WORKING
8. risk-service        ⚠️ OK    ❌ FAKE    ✓ Redis    ❌ FAKE DATA
9. vision-service      ⚠️ OK    ❌ FAKE    ✗ None    ❌ FAKE DATA
10. llm-service        ⚠️ OK    ✓ FULL    ✗ None    ✓ WORKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Legend: ✓=Good, ⚠️=Partial, ❌=Broken
```

---

## 1. API Gateway (Port 3000)

### Overview
Central HTTP router and orchestrator for all client requests.

### Files
- `services/api-gateway/Dockerfile` - Issues present
- `services/api-gateway/package.json` - OK
- `services/api-gateway/src/index.ts` - OK (basic implementation)
- `services/api-gateway/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | `RUN npm run build 2>/dev/null \|\| true` |
| Docker: Redundant retries | HIGH | Triple npm install attempt |
| Docker: No package-lock | HIGH | Missing from COPY |
| Code: Minimal routing | LOW | Only 2 endpoint stubs implemented |
| Code: No error boundary | MEDIUM | Generic error handler, no validation |

### Dependencies
- Depends on: Redis, PostgreSQL
- Depended by: Frontend

### Health Check
- Endpoint: `GET /health` ✓ Implemented
- Response: `{ status: 'API Gateway is running' }`

### What Works
- ✓ Basic Express setup
- ✓ Helmet middleware
- ✓ Rate limiting
- ✓ CORS configuration
- ✓ Health endpoint

### What's Missing
- ❌ Actual route handlers
- ❌ Service-to-service communication
- ❌ Request validation
- ❌ Response formatting

---

## 2. Session Service (Port 3001)

### Overview
WebRTC signaling server using Socket.io for video call session management.

### Files
- `services/session-service/Dockerfile` - Issues present
- `services/session-service/package.json` - Has unused dependency
- `services/session-service/src/index.ts` - INCOMPLETE (TODOs)
- `services/session-service/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | Same as api-gateway |
| Docker: Redundant retries | HIGH | Same as api-gateway |
| Code: WebRTC not implemented | CRITICAL | handleSdpOffer/Answer/IceCandidate are stubs |
| Code: Redis connection not validated | HIGH | No error handling if Redis fails |
| Code: Unused dependency | LOW | simple-peer in package.json but not used |

### Dependencies
- Depends on: Redis
- Depended by: Frontend (WebSocket)

### Health Check
- Endpoint: `GET /health` ✓ Implemented
- Response: `{ status: 'Session Service is running' }`

### What Works
- ✓ Socket.io server setup
- ✓ Session tracking
- ✓ Redis connection initialization
- ✓ Join-session event handler

### What's Missing
- ❌ SDP offer/answer exchange (lines 25-37 are TODOs)
- ❌ ICE candidate handling
- ❌ Error handling for connection failures
- ❌ Cleanup on disconnect
- ❌ Redundancy/fallback strategies

### Code Issues
```typescript
// Lines 25-37: These are all stubs
socket.on('sdp-offer', (sessionId: string, data: any) => {
  socket.to(sessionId).emit('sdp-offer', data);  // ← Just relays, no actual handling
  // TODO: Implement WebRTC offer logic
});

// Similar for sdp-answer and ice-candidate
```

---

## 3. Media Service (Port 3002)

### Overview
Handles video stream uploads and S3 storage.

### Files
- `services/media-service/Dockerfile` - Issues present
- `services/media-service/package.json` - Missing env vars
- `services/media-service/src/index.ts` - Partial implementation
- `services/media-service/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | Same as others |
| AWS Credentials: Missing | CRITICAL | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY not defined |
| Code: S3 upload incomplete | HIGH | Job processor doesn't actually upload (stub) |
| Code: No file validation | MEDIUM | No size/type checks |
| Code: AWS SDK outdated | MEDIUM | Using v2 instead of v3 |

### Dependencies
- Depends on: Redis, AWS S3
- Depended by: Various services needing video upload

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### What Works
- ✓ Express setup
- ✓ Multer file upload handler
- ✓ Bull queue creation
- ✓ Job queuing logic

### What's Missing
- ❌ AWS credentials in docker-compose
- ❌ Actual S3 upload implementation
- ❌ Error handling
- ❌ File validation
- ❌ Job failure recovery

### Code Issues
```typescript
// The actual S3 upload is never called in the job processor
mediaQueue.process(async (job) => {
  const { fileBuffer, key } = job.data;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,  // This is undefined
    Key: key,
    Body: fileBuffer,
    ContentType: 'video/mp4',
  };
  
  // This will fail because credentials are missing
  await s3.upload(params).promise();
  // ...
});
```

---

## 4. STT Service (Port 3003)

### Overview
Speech-to-text transcription service - converts audio to text.

### Files
- `services/stt-service/Dockerfile` - Issues present
- `services/stt-service/package.json` - OK
- `services/stt-service/src/index.ts` - FAKE IMPLEMENTATION
- `services/stt-service/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | Same as others |
| Code: Returns fake data | CRITICAL | Returns hardcoded 'Sample transcribed text' |
| Code: No API integration | CRITICAL | TODO comment for Deepgram/Whisper |
| Code: No error handling | HIGH | Missing try-catch blocks |
| Code: Language support missing | MEDIUM | No actual language detection |

### Dependencies
- Depends on: Redis, Deepgram API (not configured)
- Depended by: LLM service, frontend

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### What Works
- ✓ Job queue setup
- ✓ Endpoint routing
- ✓ Response formatting

### What's Missing
- ❌ Deepgram API key integration
- ❌ Audio processing
- ❌ Real transcription
- ❌ Language detection
- ❌ Confidence scoring

### Code Issues
```typescript
// Line ~44: This is a TODO comment
// TODO: Integrate with Deepgram or OpenAI Whisper API
console.log(`Processing transcription for session ${sessionId}`);

// Simulated transcription - FAKE DATA
const transcript = {
  text: 'Sample transcribed text',  // ← HARDCODED
  confidence: 0.95,  // ← FAKE
  language,
  duration: 120,
};

return { sessionId, transcript };
```

---

## 5. KYC Service (Port 3004)

### Overview
Know-Your-Customer verification and geo-location validation.

### Files
- `services/kyc-service/Dockerfile` - Issues present
- `services/kyc-service/package.json` - OK
- `services/kyc-service/src/index.ts` - FAKE IMPLEMENTATION
- `services/kyc-service/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | Same as others |
| Code: Returns fake data | CRITICAL | Hardcoded verified: true |
| Code: No document API | CRITICAL | TODO for document verification APIs |
| Code: No geofence logic | HIGH | Location validation returns hardcoded result |
| Code: No fraud detection | HIGH | No fraud indicators |

### Dependencies
- Depends on: Redis, PostgreSQL (for results storage)
- Depended by: Risk service, offer service

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### Database Model
- Uses Prisma: KYCVerification model ✓

### What Works
- ✓ Job queue setup
- ✓ Database persistence
- ✓ Location endpoint

### What's Missing
- ❌ Document verification APIs
- ❌ Geofence validation
- ❌ Fraud detection
- ❌ Error handling

### Code Issues
```typescript
// Line ~42: Hardcoded valid response
app.post('/validate-location', express.json(), async (req, res) => {
  const { latitude, longitude, sessionId } = req.body;
  
  try {
    // TODO: Implement geofence validation and fraud detection
    res.json({
      valid: true,        // ← HARDCODED
      riskLevel: 'low',   // ← HARDCODED
      message: 'Location validated',
    });
  } catch (error) {
    res.status(500).json({ error: 'Location validation failed' });
  }
});
```

---

## 6. Offer Service (Port 3008)

### Overview
Loan offer generation based on risk assessment and policy rules.

### Files
- `services/offer-service/Dockerfile` - Issues present
- `services/offer-service/package.json` - OK
- `services/offer-service/src/index.ts` - BASIC IMPLEMENTATION
- `services/offer-service/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | Same as others |
| Code: Logic hardcoded | HIGH | Fixed amounts regardless of risk |
| Code: No policy engine | MEDIUM | No rule-based offer logic |

### Dependencies
- Depends on: Redis, PostgreSQL
- Depended by: Frontend, audit service

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### Database Model
- Uses Prisma: LoanOffer model ✓

### What Works
- ✓ Job queue setup
- ✓ Database persistence
- ✓ 24-hour expiry logic
- ✓ Basic response structure

### What's Missing
- ❌ Policy rules engine
- ❌ Dynamic offer calculation
- ❌ Tenure variations
- ❌ EMI calculation based on risk

### Code Issues
```typescript
// Line ~54: Hardcoded offer logic
offerQueue.process(async (job) => {
  const { sessionId, userId, riskBand } = job.data;
  
  // TODO: Implement offer generation logic based on policy rules
  const offer = {
    loanAmount: 250000,      // ← HARDCODED
    tenureMonths: 60,        // ← HARDCODED
    interestRate: 12.5,      // ← HARDCODED
    emi: 5500,               // ← HARDCODED
    eligibilityStatus: 'approved',
  };
```

---

## 7. Audit Service (Port 3009)

### Overview
Compliance and audit logging to MongoDB.

### Files
- `services/audit-service/Dockerfile` - Issues present
- `services/audit-service/package.json` - OK
- `services/audit-service/src/index.ts` - GOOD IMPLEMENTATION
- `services/audit-service/tsconfig.json` - OK

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Docker: Error suppression | CRITICAL | Same as others |
| Code: Connection error handling | MEDIUM | MongoDB error handling incomplete |

### Dependencies
- Depends on: Redis, MongoDB
- Depended by: All services (logging)

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### What Works ✅
- ✓ Job queue setup
- ✓ MongoDB connection
- ✓ Audit log persistence
- ✓ Query capabilities
- ✓ Timestamp tracking
- ✓ Full audit trail

### What Could Improve
- ⚠️ MongoDB schema validation
- ⚠️ Retention policies
- ⚠️ Archival strategy

**This is the only service working correctly!**

---

## 8. Risk Service (Port 3005)

### Overview
ML-based loan risk assessment and scoring.

### Files
- `services/risk-service/Dockerfile` - OK ✓
- `services/risk-service/requirements.txt` - OK
- `services/risk-service/src/main.py` - FAKE IMPLEMENTATION
- No model files present

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Code: Returns fake data | CRITICAL | Hardcoded risk_score = 0.45 |
| Code: No ML model | CRITICAL | TODO comment for model loading |
| Code: No bureau data | HIGH | No credit history integration |
| Code: Placeholder fraud indicators | HIGH | Empty array |

### Dependencies
- Depends on: PostgreSQL, Redis (optional)
- Depended by: Offer service

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### What Works
- ✓ FastAPI setup
- ✓ Endpoint structure
- ✓ Request validation (Pydantic)
- ✓ Response structure

### What's Missing
- ❌ ML model files
- ❌ Model loading
- ❌ Bureau data integration
- ❌ Real risk scoring
- ❌ Fraud detection

### Code Issues
```python
# Line ~40: Placeholder logic
@app.post("/assess", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    try:
        logger.info(f"Assessing risk for session {request.session_id}")
        
        # Placeholder logic
        risk_score = 0.45  # ← HARDCODED
        risk_band = "medium" if risk_score > 0.5 else "low"
        
        response = RiskAssessmentResponse(
            risk_band=risk_band,
            risk_score=risk_score,
            propensity_score=0.72,      # ← HARDCODED
            fraud_indicators=[],         # ← EMPTY
            reasons=["Income verification needed", "New to credit history"]
        )
```

---

## 9. Vision Service (Port 3006)

### Overview
Computer vision for age estimation and liveness detection.

### Files
- `services/vision-service/Dockerfile` - OK ✓ (has system deps)
- `services/vision-service/requirements.txt` - Has MediaPipe ✓
- `services/vision-service/src/main.py` - PARTIAL IMPLEMENTATION
- No pre-trained models present

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Code: Age estimation | HIGH | Random age based on Laplacian variance heuristics |
| Code: Liveness detection | HIGH | Just detection confidence, not real anti-spoofing |
| Code: No trained models | CRITICAL | Missing pre-trained age estimation models |
| Dependencies: Missing OpenCV system libs | MEDIUM | Other Python services might need this too |

### Dependencies
- Depends on: AWS S3 (for video)
- Depended by: Risk service

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### What Works
- ✓ MediaPipe face detection
- ✓ Video frame extraction
- ✓ Face location detection
- ✓ Liveness score calculation

### What's Missing
- ❌ Pre-trained age estimation model
- ❌ Anti-spoofing detection
- ❌ Real age prediction
- ❌ Model loading/caching

### Code Issues
```python
# Line ~85: Heuristic age estimation (not ML-based)
def estimate_age_from_face(face_image: np.ndarray) -> tuple:
    """
    Estimate age from face image using simple heuristics
    In production, you'd use a pre-trained age estimation model
    """
    try:
        face_resized = cv2.resize(face_image, (200, 200))
        gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Simple age classification based on features (0-65 range)
        if laplacian_var > 500:
            estimated_age = np.random.randint(25, 45)  # ← RANDOM
            confidence = 0.78
        elif laplacian_var > 200:
            estimated_age = np.random.randint(18, 35)  # ← RANDOM
            confidence = 0.75
        else:
            estimated_age = np.random.randint(35, 65)  # ← RANDOM
            confidence = 0.72
```

---

## 10. LLM Service (Port 3007)

### Overview
Large Language Model for conversation analysis and risk indicators.

### Files
- `services/llm-service/Dockerfile` - OK ✓
- `services/llm-service/requirements.txt` - OK
- `services/llm-service/src/main.py` - COMPLETE IMPLEMENTATION ✓
- Multiple LLM provider support

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| Code: Over-engineered | LOW | 5 different providers when only 1 needed |

### Dependencies
- Depends on: LLM APIs (Groq, OpenAI, Claude, Gemini, Ollama)
- Depended by: Risk service, offer service

### Health Check
- Endpoint: `GET /health` ✓ Implemented

### Supported Providers
| Provider | Rate Limit | Cost | Status |
|----------|-----------|------|--------|
| Groq | 30 req/min | Free | ✓ RECOMMENDED |
| OpenAI | 3 req/min | Paid | ✓ OK |
| Claude | 5 req/min | Paid | ✓ OK |
| Gemini | 60 req/min | Free | ✓ OK |
| Ollama | Unlimited | Free | ✓ OK |

### What Works ✅
- ✓ Full implementation
- ✓ Multiple provider support
- ✓ Request formatting
- ✓ Response parsing
- ✓ Error handling
- ✓ Async operations

### Recommendation
For development, use **Groq** (30 req/min, free, fast).

---

## Summary Table

| Service | Docker | Code | DB | Status | Priority Fix |
|---------|--------|------|----|---------|----|
| api-gateway | ❌ | ✓ | ✓ | ⚠️ | Docker |
| session-service | ❌ | ❌ | ✓ | ❌ | WebRTC |
| media-service | ❌ | ⚠️ | ✓ | ❌ | AWS creds |
| stt-service | ❌ | ❌ | ✓ | ❌ | API integration |
| kyc-service | ❌ | ❌ | ✓ | ❌ | API integration |
| offer-service | ❌ | ⚠️ | ✓ | ✓ | Docker |
| audit-service | ❌ | ✓ | ✓ | ✓ | Docker |
| risk-service | ⚠️ | ❌ | ✓ | ❌ | ML model |
| vision-service | ⚠️ | ❌ | ✗ | ❌ | ML model |
| llm-service | ⚠️ | ✓ | ✗ | ✓ | None |

---

## Overall Assessment

### ✅ Working (2/10)
- audit-service
- llm-service

### ⚠️ Partially Working (1/10)
- offer-service (logic hardcoded but functional)

### ❌ Broken (7/10)
- api-gateway, session-service, media-service, stt-service, kyc-service, risk-service, vision-service

### Root Causes
1. **Docker errors suppressed** - Affects all 7 Node.js services
2. **Placeholder implementations** - Affects 6 services
3. **Missing API integrations** - Affects 3 services
4. **No ML models** - Affects 2 services
5. **Missing credentials** - Affects 1 service

### Time to Fix
- Docker issues: 35 minutes
- API integrations: 4-6 hours
- ML models: 8-12 hours
- WebRTC: 12-16 hours

**Total: 1-2 weeks for MVP**
