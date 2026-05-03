# Video-Based Digital Loan Origination & Risk Assessment System

A comprehensive microservices-based platform for secure, AI-powered digital loan onboarding using live video calls.

## 📋 Project Overview

This system enables end-to-end loan onboarding through:
- **Live Video Calls**: Real-time customer interaction and verification
- **AI/ML Integration**: Age estimation, risk assessment, and intelligent decision-making
- **Compliance**: Full KYC adherence, audit trails, and consent capture
- **Real-time Processing**: Job queues for STT, vision analysis, and risk assessment
- **Personalized Offers**: Dynamic loan offers based on policy and risk scores

## 🏗️ Architecture

### Microservices

| Service | Port | Tech Stack | Purpose |
|---------|------|-----------|---------|
| **API Gateway** | 3000 | Node.js/Express | Main entry point, routing, authentication |
| **Session Service** | 3001 | Node.js/WebSocket | WebRTC signaling, real-time session management |
| **Media Service** | 3002 | Node.js | Stream handling, S3 uploads, video storage |
| **STT Service** | 3003 | Node.js | Speech-to-text processing, transcription jobs |
| **KYC Service** | 3004 | Node.js/PostgreSQL | Identity verification, geo-validation |
| **Risk Service** | 3005 | Python/FastAPI | ML-based risk scoring, fraud detection |
| **Vision Service** | 3006 | Python/FastAPI | Age estimation, liveness detection |
| **LLM Service** | 3007 | Python/FastAPI | Conversational analysis, data extraction |
| **Offer Service** | 3008 | Node.js/PostgreSQL | Loan offer generation and management |
| **Audit Service** | 3009 | Node.js/MongoDB | Logging, compliance, audit trails |

### Data Layer

- **PostgreSQL**: User data, KYC info, loan offers, audit logs
- **MongoDB**: Transcripts, unstructured data, LLM outputs
- **Redis**: Session caching, queues, real-time data

### Supporting Infrastructure

- **BullMQ + Redis**: Async job processing
- **Docker Compose**: Local development environment
- **AWS S3**: Video recording storage
- **JWT/OTP**: Authentication and verification

## 📁 Project Structure

```
video-loan-system/
├── services/                    # Microservices
│   ├── api-gateway/            # Main API entry point
│   ├── session-service/        # WebRTC & signaling
│   ├── media-service/          # Video/audio handling
│   ├── stt-service/            # Speech-to-text
│   ├── kyc-service/            # Identity verification
│   ├── risk-service/           # Risk scoring (Python)
│   ├── vision-service/         # Age & liveness (Python)
│   ├── llm-service/            # LLM analysis (Python)
│   ├── offer-service/          # Loan offers
│   └── audit-service/          # Audit & logging
├── shared/
│   ├── models/                 # Shared types & Prisma schema
│   ├── queues/                 # Job queue definitions
│   └── utils/                  # Common helpers
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Main app
│   │   └── main.tsx           # Entry point
│   ├── vite.config.ts         # Vite configuration
│   └── package.json
├── config/
│   └── prisma.schema          # Database schema
├── docker-compose.yml         # Service orchestration
├── .env.example              # Environment template
└── package.json              # Root monorepo config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Docker & Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd video-loan-system
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Install dependencies**
```bash
npm install
# This installs root dependencies and triggers workspace setup
```

4. **Start services with Docker**
```bash
docker-compose up -d
```

Verify all services are running:
```bash
docker-compose ps
```

5. **Run database migrations** (if using Prisma)
```bash
npm run db:migrate
```

## 🔧 Configuration

### Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/video_loan_db
MONGODB_URI=mongodb://admin:password@localhost:27017/video_loan_system
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=video-loan-recordings

# APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...

# Authentication
JWT_SECRET=your_secret_key
OTP_EXPIRY=5m
```

## 📦 Service Communication

### Event Flow

```
Customer Entry
    ↓
API Gateway (Session Init)
    ↓
Session Service (WebRTC Signaling)
    ↓
Media Service (Record Video/Audio)
    ↓
├─ STT Service (Transcription)
├─ Vision Service (Age Estimation)
└─ KYC Service (Identity Check)
    ↓
LLM Service (Data Analysis)
    ↓
Risk Service (Scoring)
    ↓
Offer Service (Generate Offers)
    ↓
Audit Service (Log Everything)
```

### API Endpoints

#### API Gateway
```
POST   /api/sessions              - Create new session
GET    /api/sessions/:id          - Get session details
POST   /api/sessions/:id/complete - Mark session complete
```

#### Offer Service
```
POST   /api/offers/generate       - Generate loan offer
GET    /api/offers/:offerId       - Get offer details
POST   /api/offers/:offerId/accept - Accept offer
```

#### Audit Service
```
POST   /api/audit/log             - Log audit event
GET    /api/audit/logs/:sessionId - Get session logs
```

## 🧪 Development

### Running Services Locally

**Option 1: With Docker**
```bash
docker-compose up -d
```

**Option 2: Individual Services**
```bash
# Terminal 1 - API Gateway
cd services/api-gateway
npm run dev

# Terminal 2 - Session Service
cd services/session-service
npm run dev

# Terminal 3 - Python Service (Risk)
cd services/risk-service
python -m uvicorn src.main:app --reload --port 3005
```

### Frontend Development
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

### Testing

```bash
npm run test                    # Run all tests
npm run test:watch            # Watch mode
npm run coverage              # Coverage report
```

### Code Quality

```bash
npm run lint                  # Lint all services
npm run build                 # Build all services
```

## 🐳 Docker Deployment

### Build Images
```bash
docker-compose build
```

### Start Stack
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f [service-name]
```

### Stop Stack
```bash
docker-compose down -v       # Include -v to remove volumes
```

## 🔐 Security Considerations

1. **API Authentication**: JWT tokens with OTP verification
2. **Video Privacy**: All videos encrypted before S3 storage
3. **Data Minimization**: Transcripts anonymized after processing
4. **Audit Logging**: Immutable logs of all operations
5. **SSL/TLS**: HTTPS for all external communication
6. **Rate Limiting**: API gateway enforces rate limits

## 📊 Database Schema

### Key Tables (PostgreSQL)

- **Users**: Customer profiles and KYC data
- **VideoSessions**: Call records with metadata
- **STTTranscripts**: Conversation transcripts
- **AgeEstimations**: Computer vision results
- **RiskAssessments**: Risk scores and indicators
- **LoanOffers**: Generated loan offers
- **ConsentRecords**: Verbal consent audit trail
- **AuditLogs**: Complete audit trail

See `config/prisma.schema` for full schema.

## 🎯 Judging Criteria Mapping

| Criterion | Implementation |
|-----------|-----------------|
| **End-to-End Digitization** | Complete video-based onboarding with auto-filled forms |
| **Accuracy & Compliance** | KYC integrated, geo-validation, audit trails |
| **Risk Mitigation** | ML-based fraud detection, location verification |
| **Intelligence & Personalization** | LLM contextual analysis, personalized offers |
| **Scalability & Reliability** | Microservices, job queues, horizontal scaling |

## 📝 Development Roadmap

- [ ] Integration with Deepgram/OpenAI for STT
- [ ] AWS Rekognition for computer vision
- [ ] Anthropic Claude API integration
- [ ] Bureau data connectors
- [ ] Advanced fraud detection models
- [ ] Mobile app (React Native)
- [ ] Kubernetes deployment configs
- [ ] Advanced analytics dashboard
- [ ] Webhook integrations
- [ ] SMS/WhatsApp notifications

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit changes (`git commit -am 'Add feature'`)
3. Push to branch (`git push origin feature/your-feature`)
4. Open a Pull Request

## 📞 Support & Contact

For issues or questions:
- Create an issue in the repository
- Contact the development team

## 📄 License

This project is proprietary and confidential.

---

**Ready to start?** Run `docker-compose up -d` and visit `http://localhost:5173` to begin!
