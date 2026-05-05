# LoanVision AI — Video-Based Digital Loan Origination System

A secure, AI-powered loan origination platform that onboards customers through live video calls, capturing consent, identity verification, and risk assessment in real-time.

## Architecture

```
Frontend (React + Vite)  ──►  API Gateway (:3000)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            Session (:3001)   Media (:3002)    STT (:3003)
            KYC (:3004)       Risk (:3005)     Vision (:3006)
            LLM (:3007)       Offer (:3008)    Audit (:3009)
```

| Service | Port | Language | Purpose |
|---------|------|----------|---------|
| **API Gateway** | 3000 | Node.js | JWT auth, routing, pipeline orchestration |
| **Session** | 3001 | Node.js | WebRTC signaling, session management |
| **Media** | 3002 | Node.js | Video/audio storage & retrieval |
| **STT** | 3003 | Node.js | Speech-to-text (Deepgram + simulation) |
| **KYC** | 3004 | Node.js | Geo-fence, consent, age verification |
| **Risk** | 3005 | Python | Credit scoring, fraud detection |
| **Vision** | 3006 | Python | Face detection, age estimation (MediaPipe) |
| **LLM** | 3007 | Python | Conversation analysis (Groq/Gemini/local) |
| **Offer** | 3008 | Node.js | Policy-based offer generation, EMI calc |
| **Audit** | 3009 | Node.js | Immutable audit trail & compliance logs |

## Quick Start

### Frontend Only (No Backend Required)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```
The frontend works standalone with built-in simulation.

### Full Stack with Docker
```bash
cp .env.example .env   # Edit with your keys
docker-compose up -d
cd frontend && npm run dev
```

### Individual Service
```bash
# Node.js services
cd services/api-gateway && npm install && npm run dev

# Python services
cd services/risk-service && pip install fastapi uvicorn pydantic python-dotenv && uvicorn src.main:app --port 3005 --reload
```

## Key Features

- **Video KYC**: Live webcam with face detection & liveness checks
- **Real-time STT**: Browser Speech API + Deepgram integration
- **AI Analysis**: LLM-powered conversation intelligence (Groq/Gemini/OpenAI/Ollama)
- **Risk Engine**: Rule-based scoring with bureau simulation & fraud detection
- **Offer Generation**: Policy-driven with reducing-balance EMI calculation
- **Audit Trail**: Immutable logs for regulatory compliance
- **Geo-Fencing**: Location validation with configurable boundaries
- **Consent Capture**: Verbal consent recording with audit trail

## Environment Variables

Copy `.env.example` to `.env`. Required keys:
- `JWT_SECRET` — Authentication secret
- `DEEPGRAM_API_KEY` — For real STT (optional, simulation available)
- `GROQ_API_KEY` or `GEMINI_API_KEY` — For LLM analysis (optional)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Web Speech API
- **Backend (Node.js)**: Express, Socket.io, Redis, Bull
- **Backend (Python)**: FastAPI, MediaPipe, OpenCV
- **Infrastructure**: Docker Compose, PostgreSQL, MongoDB, Redis
