# 🎥 LoanVision AI — Video-Based Digital Loan Origination System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Open Source](https://img.shields.io/badge/Open-Source-brightgreen)](LICENSE)

> **Revolutionize loan origination with AI-powered video KYC, real-time risk assessment, and instant offers.**

A production-ready, secure platform that automates the entire loan application process through live video calls, incorporating modern AI/ML technologies for identity verification, fraud detection, and intelligent credit scoring.

**✨ Key Highlights:**
- 🎬 **Live Video KYC** with AI-powered face detection and liveness verification
- 🤖 **AI Conversation Analysis** using Groq/Gemini LLMs
- 📊 **Real-time Risk Scoring** with fraud detection
- ⚡ **Instant Loan Offers** with EMI calculations
- 🔐 **Bank-grade Security** with JWT auth and audit trails
- 🏗️ **Microservices Architecture** for scalability
- 🐳 **Docker-ready** for easy deployment

## 📋 Table of Contents

- [Overview](#-loanvision-ai--video-based-digital-loan-origination-system)
- [Features](#-key-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Security](#-security)
- [FAQ](#-faq)
- [Support](#-support)

---

## 🏗️ Architecture

```
Frontend (React + Vite)  ──►  API Gateway (:3000)
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
           Session       Media Services   Analysis Services
          (:3001)       (:3002-3003)      (:3004-3009)
           │                  │                  │
           ├─ WebRTC ─────────┼─────────────────┤
           │                  │                  │
           └──► Database Infrastructure ◄───────┘
                PostgreSQL | MongoDB | Redis
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

## ⚡ Quick Start

### Option 1: Frontend Only (5 minutes) 🚀
Perfect for UI testing without backend setup:

```bash
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git
cd AI-Video-loan-system/frontend
npm install
npm run dev
# Open http://localhost:5173
```

✅ Includes built-in simulation data - no backend needed!

### Option 2: Full Stack with Docker (15 minutes) 🐳
Complete development environment:

```bash
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git
cd AI-Video-loan-system

# Setup configuration
cp .env.example .env
# ⚠️ Edit .env with your API keys (see below)

# Start everything
npm install
docker-compose up -d

# Start frontend
cd frontend && npm run dev
# Open http://localhost:5173
```

**Get free API keys:**
- 🔑 **GROQ_API_KEY**: https://console.groq.com (free tier available)
- 🔐 **JWT_SECRET**: Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Option 3: Individual Service Development
For working on a specific service:

```bash
# Node.js service
cd services/api-gateway
npm install
npm🛠️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast builds
- Web Speech API for transcription
- WebRTC for video calling

**Backend (Node.js):**
- Express.js for REST API
- Socket.io for real-time communication
- Redis for caching & sessions
- Bull for job queues

**Backend (Python):**
- FastAPI for high-performance APIs
- MediaPipe for computer vision
- OpenCV for image processing
- Groq/Gemini for LLM services

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching
- Lerna for monorepo management
```

---

## ✅ Verify Setup

```bash
# Check all services are running
docker-compose ps

# Test API Gateway
curl http://localhost:3000/health

# View logs
docker-compose logs -f
cd services/api-gateway && npm install && npm run dev

# Python services
cd services/risk-service && pip install fastapi uvicorn pydantic python-dotenv && uvicorn src.main:app --port 3005 --reload
```

## Key Features

- **Video KYC**: Live webcam with face detection & liveness checks
- **Real-time STT**: Browser Speech API + Deepgram integration
- **AI Analysis**: LLM-powered conversation intelligence (Groq/Gemini/OpenAI/Ollama)
- *📚 Documentation

| Document | Purpose |
|----------|---------|
| 📖 **[SETUP.md](SETUP.md)** | Step-by-step local development setup with troubleshooting |
| 🏗️ **[ARCHITECTURE.md](ARCHITECTURE.md)** | System design, data flow, and service responsibilities |
| 📝 **[API.md](API.md)** | Complete REST API reference with examples |
| 🛣️ **[ROADMAP.md](ROADMAP.md)** | Future features and planned improvements |
| 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)** | Contribution guidelines and workflow |
| 🔐 **[SECURITY.md](SECURITY.md)** | Security policies and vulnerability reporting |
| 📋 **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** | Community standards and expectations |
| 📈 **[CHANGELOG.md](CHANGELOG.md)** | Version history and release notes |

### 🚀 Getting Started Resources

- **First time?** Start with [SETUP.md](SETUP.md)
- **Want to contribute?** Read [CONTRIBUTING.md](CONTRIBUTING.md)
- **Building with API?** Check [API.md](API.md)
- **Understanding design?** See [ARCHITECTURE.md](ARCHITECTURE.md)
```bash
# Clone & setup
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git
cd AI-Video-loan-system
cp .env.example .env

# Get API keys (free)
# - GROQ_API_KEY: https://console.groq.com
# - JWT_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env, then start
npm install
docker-compose up -d
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

### Full Documentation
See **[SETUP.md](SETUP.md)** for detailed setup instructions.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to set up your development environment
- Commit guidelines and branch naming conventions
- Pull request process
- Coding standards
- Testing requirements

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes & test locally
4. Commit with descriptive messages: `git commit -m "feat: add your feature"`
5. 🤝 Contributing

We love contributions! Whether it's bug fixes, features, or documentation, we welcome your help.

### Quick Start
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/AI-Video-loan-system.git`
3. **Create** a branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Commit** with clear messages: `git commit -m "feat: add amazing feature"`
6. **Push** to your fork
7. **Create** a Pull Request

### Contribution Guidelines
- 📖 Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
- 💬 Use clear commit messages (see conventional commits format)
- ✅ Test your changes locally
- 📝 Update documentation if needed
- 🔍 Run `npm run lint` before submitting

### Looking for Issues?
Check [open issues](https://github.com/sanjaysaini383/AI-Video-loan-system/issues) labeled:
- `good-first-issue` — Great for beginners
- `help-wanted` — Need community help
- `documentation` — Improve docs

---

## 🔐 Security

Security is our top priority! Please see [SECURITY.md](SECURITY.md) for:

### For Users
- ✅ JWT-based authentication
- ✅ Rate limiting (100 req/15 min)
- ✅ Helmet.js security headers
- ✅ Input validation & sanitization
- ✅ Audit logging of all actions

### For Contributors
- 🔒 Never commit secrets or API keys
- 🔒 Use `.env.example` as template
- 🔒 Run `npm audit` regularly
- 🔒 Report vulnerabilities via [SECURITY.md](SECURITY.md)

⚠️ **Found a security issue?** Please report it to **security@example.com** instead of opening a public issue.

---

## ❓ FAQ

### Q: Do I need all services running?
**A:** No! You can:
- Run just the **frontend** for UI testing (no backend needed)
- Run a **single service** for development
- Run the **full stack** for integration testing

### Q: Can I use this in production?
**A:** Yes, but ensure you:
- Change all default passwords in `.env`
- Generate a strong `JWT_SECRET`
- Set up proper SSL/TLS
- Configure proper backups
- Enable audit logging
- Review [SECURITY.md](SECURITY.md)

### Q: Which LLM provider should I use?
**A:** 
- **Groq** (default) - Free tier, fast
- **Gemini** - Good for summarization
- **OpenAI** - More accurate but paid
- **Ollama** - Local, privacy-focused

### Q: How do I contribute without coding?
**A:**
- 📝 Improve documentation
- 🐛 Report bugs with details
- 💡 Suggest features
- 🎨 Improve UI/UX
- 🌍 Help with translations

### Q: What are the system requirements?
**A:**
- **Node.js** 18+
- **Python** 3.9+
- **Docker** (for full stack)
- **4GB RAM** minimum
- **2GB disk space** minimum

### Q: How long does setup take?
**A:**
- **Frontend only**: 5 minutes
- **Full stack with Docker**: 15 minutes
- **Single service**: 10 minutes

### Q: Is this GDPR compliant?
**A:** The system is designed with privacy in mind:
- ✅ Minimal data collection
- ✅ Audit trails for transparency
- ✅ Encrypted credentials
- Review [SECURITY.md](SECURITY.md) for details

---

## 💬 Support & Community

Have questions? We're here to help!

| Channel | Purpose | Link |
|---------|---------|------|
| 💬 **Discussions** | Ask questions & share ideas | [GitHub Discussions](https://github.com/sanjaysaini383/AI-Video-loan-system/discussions) |
| 🐛 **Issues** | Report bugs & request features | [GitHub Issues](https://github.com/sanjaysaini383/AI-Video-loan-system/issues) |
| 🔐 **Security** | Report vulnerabilities | [security@example.com](mailto:security@example.com) |
| 📖 **Documentation** | Read detailed guides | [View Docs](SETUP.md) |

---

## 📊 Project Status

| Status | Details |
|--------|---------|
| **Version** | 1.0.0 |
| **License** | MIT |
| **Node.js** | 18+ supported |
| **Python** | 3.9+ supported |
| **Docker** | Ready to deploy |
| **Open Source** | ✅ Yes |
| **Production Ready** | ✅ Yes (after security setup) |

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

MIT License means:
- ✅ Use for personal projects
- ✅ Use for commercial projects
- ✅ Modify and distribute
- ❌ No warranty
- ❌ No liability

---

## 🙏 Acknowledgments

Built with:
- 🎬 WebRTC for real-time video
- 🤖 MediaPipe for computer vision
- 🧠 Groq API for LLM services
- 🐳 Docker for containerization
- 📚 Open source community

---

## 🚀 Ready to Get Started?

1. ⭐ **Star this repository** to show support
2. 🍴 **Fork** to contribute
3. 📖 Read [SETUP.md](SETUP.md)
4. 🎯 Follow the quick start above
5. 💬 Join our community discussions
6. 🤝 Consider contributing!

---

**Questions?** [Open a discussion](https://github.com/sanjaysaini383/AI-Video-loan-system/discussions) or [report an issue](https://github.com/sanjaysaini383/AI-Video-loan-system/issues).

Happy coding! 🎉