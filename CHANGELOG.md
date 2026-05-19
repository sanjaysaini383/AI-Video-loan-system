# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial public release of LoanVision AI
- Complete video-based loan origination platform
- Multi-service microservices architecture:
  - API Gateway with JWT authentication
  - Session Service for WebRTC signaling
  - Media Service for video/audio storage
  - STT Service for speech-to-text (Deepgram integration)
  - KYC Service for identity verification
  - Risk Service for credit scoring
  - Vision Service for face detection (MediaPipe)
  - LLM Service for conversation analysis (Groq/Gemini)
  - Offer Service for loan offer generation
  - Audit Service for compliance logging
- React/TypeScript frontend with Vite
- Docker Compose for local development
- Comprehensive documentation:
  - Architecture overview
  - Contributing guidelines
  - Security policy
  - Setup guide
  - API documentation

### Security
- JWT token-based authentication
- Rate limiting on API Gateway
- CORS protection
- Input validation and sanitization
- Helmet.js for security headers
- Environment variable management for secrets

### Known Issues
None at this time. Please report issues on GitHub.

---

## Unreleased

### Planned
- [ ] GraphQL API support
- [ ] Machine learning-based credit scoring
- [ ] Real-time bureau integration
- [ ] Multi-language support
- [ ] Kubernetes deployment guides
- [ ] SMS/Email notifications
- [ ] Advanced fraud detection ML model
