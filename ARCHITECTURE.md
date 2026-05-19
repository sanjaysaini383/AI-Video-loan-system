# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│                     (WebRTC + Web Speech)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 3000)                       │
│            JWT Auth • Rate Limiting • Routing                    │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   Session     Media       STT        KYC       Risk
  (3001)       (3002)     (3003)     (3004)    (3005)
 WebRTC        Video      Deepgram   Verify    Scoring
 Signaling     Storage    API        Consent   & Fraud

       │          │          │          │          │
       └──────────┼──────────┴──────────┴──────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
  Vision        LLM           Offer
 (3006)        (3007)        (3008)
Face Detect   Analysis      Generation
Age Est.      Groq/Gemini   EMI Calc

                  │
                  ▼
              Audit
             (3009)
           Compliance
            Logging

Databases:
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│    PostgreSQL    │   │     MongoDB      │   │      Redis       │
│   (Sessions,     │   │  (Media Refs,    │   │  (Token Store,   │
│   Audit Logs)    │   │   Conversations) │   │   Cache)         │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

## Service Responsibilities

### 🔐 API Gateway (Node.js)
- **Port:** 3000
- **Role:** Central request router and authentication
- **Features:**
  - JWT token validation
  - Request routing to services
  - Rate limiting (100 req/15 min)
  - Response aggregation
  - Error handling

**Key Routes:**
```
POST   /auth/register         → Register user
POST   /auth/login            → Login & JWT
POST   /onboarding/start      → Initiate KYC
GET    /onboarding/status     → Check progress
POST   /offers                → Get loan offers
GET    /audit/trail           → Compliance logs
```

### 🎥 Session Service (Node.js)
- **Port:** 3001
- **Role:** WebRTC signaling and session management
- **Technologies:** Socket.io, Simple Peer
- **Features:**
  - Peer connection establishment
  - SDP offer/answer negotiation
  - ICE candidate gathering
  - Session lifecycle management

### 📹 Media Service (Node.js)
- **Port:** 3002
- **Role:** Video and audio storage
- **Database:** MongoDB (GridFS for large files)
- **Features:**
  - Video chunk uploads
  - Media metadata storage
  - Retrieval and streaming
  - Cleanup of expired media

### 🎤 STT Service (Node.js)
- **Port:** 3003
- **Role:** Speech-to-text processing
- **Providers:** Deepgram API (primary), Browser Speech API (fallback)
- **Features:**
  - Real-time transcription
  - Multi-speaker support
  - Confidence scoring
  - Fallback to simulation mode

### 🪪 KYC Service (Node.js)
- **Port:** 3004
- **Role:** Know-Your-Customer verification
- **Features:**
  - Geofence validation
  - Consent capture & recording
  - Age verification
  - Eligibility checks
  - Document collection

### 📊 Risk Service (Python)
- **Port:** 3005
- **Role:** Credit risk assessment
- **Framework:** FastAPI
- **Features:**
  - Bureau data simulation
  - Credit score calculation
  - Fraud detection rules
  - Risk categorization (Low/Medium/High)

### 👁️ Vision Service (Python)
- **Port:** 3006
- **Role:** Computer vision analysis
- **Libraries:** MediaPipe, OpenCV
- **Features:**
  - Face detection & liveness
  - Estimated age verification
  - Facial landmark tracking
  - Spoofing detection

### 🧠 LLM Service (Python)
- **Port:** 3007
- **Role:** Conversation intelligence
- **Models:** Groq (llama2), Gemini, OpenAI, Ollama
- **Features:**
  - Conversation summarization
  - Intent detection
  - Customer sentiment analysis
  - Compliance check

### 💰 Offer Service (Node.js)
- **Port:** 3008
- **Role:** Loan offer generation
- **Algorithms:** Policy-based engine
- **Features:**
  - Loan amount calculation
  - Interest rate assignment
  - Tenure options
  - EMI calculation (reducing-balance)

### 📋 Audit Service (Node.js)
- **Port:** 3009
- **Role:** Immutable audit trails
- **Database:** PostgreSQL
- **Features:**
  - Action logging
  - Timestamp verification
  - Compliance reporting
  - Data export

## Data Flow

### Typical Loan Onboarding Flow

```
1. User Initiation
   └─→ POST /onboarding/start (API Gateway)
       └─→ Session Service: Create WebRTC session
       └─→ Audit Service: Log initiation

2. Video Call
   └─→ WebRTC Peer Connection (Session Service)
   └─→ Media Service: Store video chunks
   └─→ STT Service: Transcribe audio (real-time)

3. Identity Verification (Parallel)
   ├─→ Vision Service: Face detection & liveness
   ├─→ KYC Service: Age verification
   └─→ KYC Service: Capture consent

4. Risk Assessment
   └─→ LLM Service: Analyze conversation
   └─→ Risk Service: Calculate credit score
   └─→ Risk Service: Fraud detection

5. Offer Generation
   └─→ Offer Service: Generate loan offers
   └─→ Audit Service: Log all decisions

6. Response to User
   └─→ API Gateway: Aggregate results
   └─→ Frontend: Display offers
```

## Database Schema

### PostgreSQL (Sessions, Audit)
```sql
-- Users & Sessions
users (id, email, phone, created_at)
sessions (id, user_id, token, expires_at)

-- Audit Trail
audit_logs (id, user_id, action, details, timestamp)
onboarding_history (id, user_id, stage, result, timestamp)
```

### MongoDB (Media, Conversations)
```javascript
// Media Metadata
{
  _id: ObjectId,
  session_id: "uuid",
  user_id: "uuid",
  type: "video|audio",
  upload_url: "gridfs://...",
  duration: 3600,
  created_at: ISODate
}

// Conversations
{
  _id: ObjectId,
  session_id: "uuid",
  messages: [
    { role: "user", text: "...", timestamp: ISODate },
    { role: "agent", text: "...", timestamp: ISODate }
  ],
  summary: "...",
  sentiment: "positive|neutral|negative"
}
```

### Redis (Cache, Tokens)
```
token_blacklist:{token_hash} → TTL: JWT expiry time
session:{session_id} → session state
rate_limit:{ip} → request count
```

## Security Architecture

### Authentication
- JWT tokens with RS256 signing
- Token expiry: 24 hours (configurable)
- Refresh token rotation
- Token blacklist on logout

### Authorization
- Role-based access control (Admin, Officer, User)
- Service-to-service mTLS (optional)
- API key validation for third-party integrations

### Data Protection
- HTTPS/TLS for all external communication
- Encrypted fields for PII (in-transit and at-rest)
- Audit logging of all data access
- GDPR-compliant data deletion

## Deployment Architecture

### Development
- Docker Compose orchestrates all services
- Shared .env for configuration
- Local databases (PostgreSQL, MongoDB)
- Redis for caching

### Production (Recommended)
- Kubernetes for orchestration
- Managed databases (AWS RDS, MongoDB Atlas)
- API Gateway on Nginx/Envoy
- CDN for frontend assets
- Monitoring (Prometheus, Grafana, ELK)

## Performance Considerations

### Caching Strategy
- Offer calculations cached (1 hour)
- User session data cached (24 hours)
- Risk scores cached (6 hours)
- Media metadata cached (persistent)

### Database Indexes
```
PostgreSQL:
- users(email) UNIQUE
- audit_logs(user_id, timestamp DESC)
- sessions(token)

MongoDB:
- onboarding(session_id, created_at DESC)
- media(session_id)
- conversations(user_id, created_at DESC)
```

### Rate Limiting
- Global: 100 requests/15 minutes per IP
- Auth endpoint: 5 attempts/15 minutes
- STT endpoint: 10 requests/minute
- Offer endpoint: 2 requests/minute per user

## Scalability

### Horizontal Scaling
- Stateless services (scale to multiple instances)
- Load balancer distributes requests
- Shared Redis for distributed caching
- Database read replicas for queries

### Vertical Scaling
- Increase compute resources per service
- Batch processing for heavy operations
- Async job queues (Bull for Node.js)

## Monitoring & Logging

### Key Metrics
- API Gateway latency (p50, p95, p99)
- Service availability (uptime %)
- Database query performance
- Token generation rate
- Offer generation time

### Logging Standards
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing
- No sensitive data in logs

## Future Enhancements

1. **Machine Learning**
   - Custom credit scoring model
   - Fraud detection ML pipeline
   - Sentiment analysis refinement

2. **Advanced Features**
   - Multi-language support
   - Biometric authentication
   - Real-time bureau integration

3. **Infrastructure**
   - GraphQL API option
   - WebSocket for live updates
   - Event streaming (Kafka)
   - Microservices mesh (Istio)
