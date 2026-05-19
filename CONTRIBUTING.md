# Contributing to LoanVision AI

Thank you for your interest in contributing to LoanVision AI! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Please be respectful, inclusive, and constructive in all interactions. We are committed to providing a harassment-free experience for everyone.

---

## Getting Started

### Prerequisites

- **Node.js** v18+ or **Python** 3.9+
- **Docker** & **Docker Compose** (for full stack development)
- **Git**

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AI-Video-loan-system.git
   cd AI-Video-loan-system
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/sanjaysaini383/AI-Video-loan-system.git
   ```

---

## Development Setup

### Option 1: Full Stack with Docker (Recommended)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys:
# - GROQ_API_KEY (or use GEMINI_API_KEY)
# - DEEPGRAM_API_KEY (optional)
# - JWT_SECRET (will be auto-generated if not set)

# Start all services
docker-compose up -d

# Install frontend dependencies
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

### Option 2: Frontend Only (Quick Testing)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Option 3: Individual Service Development

**Node.js Service Example:**
```bash
cd services/api-gateway
npm install
npm run dev
```

**Python Service Example:**
```bash
cd services/risk-service
pip install -r requirements.txt
python -m uvicorn src.main:app --port 3005 --reload
```

---

## Making Changes

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code refactoring
- `test/` — Tests
- `chore/` — Maintenance tasks

### Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

---

## Commit Guidelines

### Commit Message Format

Use clear, descriptive commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `refactor` — Code restructuring
- `test` — Test additions
- `chore` — Build, deps, config
- `perf` — Performance improvements

**Scope:** Service or component name (optional)

**Subject:**
- Use imperative mood ("add" not "added")
- Don't capitalize first letter
- No period at the end
- Max 50 characters

**Example:**
```
feat(kyc): add face liveness detection

- Implement liveness check using MediaPipe Face Detection
- Add configurable sensitivity thresholds
- Include fallback to manual verification

Closes #42
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests & linting:**
   ```bash
   npm run lint
   npm run test
   ```

3. **Build verification:**
   ```bash
   npm run build
   docker-compose build  # for full stack
   ```

### Submit Your PR

1. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub with:
   - Clear title describing the change
   - Description of what changed and why
   - Link any related issues (e.g., "Closes #42")
   - Screenshots if UI/UX changes

3. **PR Template:**
   ```markdown
   ## Description
   Brief explanation of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## How to Test
   Steps to verify the changes work

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No console errors/warnings
   - [ ] No hardcoded secrets/credentials
   ```

### Review Process

- At least one maintainer approval required
- Address feedback constructively
- Push additional commits (no force push during review)
- Once approved, maintainer will merge

---

## Coding Standards

### TypeScript/JavaScript

- **Formatter:** Prettier (auto-format on save recommended)
- **Linter:** ESLint
- **Style:**
  - Use `const` by default, `let` when needed, avoid `var`
  - Use meaningful variable names
  - Add JSDoc comments for functions
  - Keep functions focused and small

**Example:**
```typescript
/**
 * Validates loan application eligibility
 * @param userId - The user's unique identifier
 * @param applicantData - Application details
 * @returns true if eligible, false otherwise
 */
export function validateEligibility(
  userId: string,
  applicantData: ApplicantData
): boolean {
  // Implementation
  return isEligible;
}
```

### Python

- **Formatter:** Black
- **Linter:** Pylint/Flake8
- **Style:**
  - Follow PEP 8 guidelines
  - Use type hints
  - Add docstrings to functions

**Example:**
```python
def calculate_risk_score(applicant: ApplicantData) -> float:
    """
    Calculate risk score for loan applicant.
    
    Args:
        applicant: Application data
        
    Returns:
        Risk score between 0-100
    """
    # Implementation
    return score
```

### File Organization

```
service/src/
├── index.ts              # Entry point
├── config.ts             # Configuration
├── middleware/           # Custom middleware
├── routes/               # API routes
├── controllers/          # Request handlers
├── services/             # Business logic
├── models/               # Data models/types
├── utils/                # Helper functions
└── constants.ts          # Constants
```

---

## Testing

### Add Tests for Your Changes

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run with coverage
npm run test -- --coverage
```

**Testing guidelines:**
- Write unit tests for business logic
- Test edge cases and error scenarios
- Aim for >70% code coverage
- Use descriptive test names

---

## Reporting Issues

### Before Creating an Issue

1. Check existing issues to avoid duplicates
2. Ensure it's a real bug/feature request, not a usage question
3. Gather relevant information

### Issue Template

```markdown
## Description
Clear, concise description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows/Mac/Linux
- Node: v18.x
- Python: 3.9.x
- Docker: 20.x

## Additional Context
Screenshots, logs, error messages, etc.
```

---

## Project Structure Overview

```
video-loan-system/
├── frontend/              # React UI
├── services/
│   ├── api-gateway/       # Request routing & auth
│   ├── session-service/   # WebRTC signaling
│   ├── kyc-service/       # Identity verification
│   ├── media-service/     # Video/audio handling
│   ├── stt-service/       # Speech-to-text
│   ├── vision-service/    # Face detection (Python)
│   ├── risk-service/      # Risk scoring (Python)
│   ├── llm-service/       # AI analysis (Python)
│   ├── offer-service/     # Loan offers
│   └── audit-service/     # Compliance logging
├── shared/                # Shared types & utilities
├── config/                # Prisma schema
└── docker-compose.yml     # Local development stack
```

---

## Quick Reference

### Common Commands

```bash
# Install dependencies (root)
npm install

# Development mode
npm run dev

# Build all services
npm run build

# Lint code
npm run lint

# Run tests
npm run test

# Docker operations
docker-compose up -d       # Start
docker-compose down        # Stop
docker-compose logs -f     # View logs
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your API keys
```

**Required for full functionality:**
- `JWT_SECRET` — Authentication key
- `GROQ_API_KEY` or `GEMINI_API_KEY` — LLM service
- `DEEPGRAM_API_KEY` — Speech-to-text (optional)

---

## Getting Help

- 💬 **Questions?** Open a Discussion on GitHub
- 🐛 **Found a bug?** Open an Issue with reproduction steps
- 📖 **Documentation?** Check `docs/` folder or README.md
- 💡 **Ideas?** Start a Discussion to gauge community interest

---

## License

By contributing, you agree that your contributions will be licensed under the same license as this project (check LICENSE file).

---

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- CONTRIBUTORS.md file

---

Thank you for contributing! 🚀
