# ⚡ First 30 Minutes Guide

**Just want to get started FAST? Follow this exact guide.** ⏱️

---

## Minute 0-2: Prerequisites Check

Open PowerShell and run:

```powershell
# Check Node.js
node --version    # Should be v18+

# Check Docker
docker --version  # Should be v20+

# Check Git
git --version     # Should be v2.30+
```

❌ **Missing any?** Install before proceeding:
- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

✅ **Have all three?** Continue!

---

## Minute 2-5: Clone & Navigate

```powershell
# Navigate to your projects folder
cd d:\SF-Repos

# Clone the repository
git clone https://github.com/sanjaysaini383/AI-Video-loan-system.git

# Enter the project
cd AI-Video-loan-system

# Verify you're in the right place
ls  # Should see: docker-compose.yml, README.md, etc.
```

---

## Minute 5-10: Environment Setup

```powershell
# Copy environment template
Copy-Item .env.example -Destination .env

# Open .env in your editor
code .env
```

**In the .env file, fill in ONLY these (rest can stay as default):**

```env
# AWS (Get from: https://console.aws.amazon.com/)
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_S3_BUCKET=video-loan-recordings

# OpenAI (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxxx

# Anthropic (Get from: https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Generate a random string (use online: https://www.random.org/strings/)
JWT_SECRET=any_random_32_character_string_here
```

❓ **Don't have API keys yet?** See [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md)

✅ **Filled in the keys?** Continue!

---

## Minute 10-15: Start Docker

```powershell
# Make sure Docker Desktop is running first!
# (Open Docker Desktop app if not running)

# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Verify everything started
docker-compose ps

# Should see: All containers with status "Up"
```

⏳ **This takes 2-3 minutes...**

---

## Minute 15-20: Install Dependencies

```powershell
# Install Node dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# That's it!
```

---

## Minute 20-25: Start Frontend

```powershell
# Start the development server
cd frontend
npm run dev

# You'll see: "Local: http://localhost:5173"
```

---

## Minute 25-30: Test It!

✅ **Open your browser:**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- Prisma Studio: http://localhost:5555

**Try this in PowerShell:**
```powershell
# Test if services are running
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3008/health

# Should see: {"status": "Service is running"}
```

---

## 🎉 Congrats! You're Done

You now have:
- ✅ 10 microservices running
- ✅ React frontend at http://localhost:5173
- ✅ PostgreSQL database
- ✅ MongoDB database
- ✅ Redis cache
- ✅ Complete API infrastructure

---

## Next Steps (Optional)

### Explore the Frontend
1. Open http://localhost:5173
2. Click on "Onboarding" tab
3. Try filling in the form

### View the Database
1. Open http://localhost:5555
2. Explore the database schema

### Test the API
```powershell
# Create a session
curl -X POST http://localhost:3000/api/sessions `
  -H "Content-Type: application/json" `
  -d '{
    "phoneNumber": "9876543210",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### View Service Logs
```powershell
# See what services are doing
docker-compose logs -f api-gateway
docker-compose logs -f postgres

# Press Ctrl+C to exit
```

---

## Common Problems (Quick Fixes)

**"docker: command not found"**
→ Start Docker Desktop app

**"Port 3000 already in use"**
```powershell
netstat -ano | findstr :3000
taskkill /PID <number> /F
```

**"npm install failed"**
```powershell
npm cache clean --force
npm install
```

**"Docker containers won't start"**
```powershell
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**"API Gateway not responding"**
```powershell
# Wait 30 seconds for services to fully start
docker-compose logs api-gateway
```

---

## Important Files to Know

- **Frontend code:** `frontend/src/`
- **Services code:** `services/*/src/`
- **Configuration:** `.env` (YOUR FILE - DON'T COMMIT!)
- **Database schema:** `config/prisma.schema`
- **Docker setup:** `docker-compose.yml`
- **Full documentation:** `COMPLETE_SETUP_GUIDE.md`

---

## Stopping & Restarting

```powershell
# Stop everything (keeps data)
docker-compose stop

# Start again
docker-compose up -d

# Stop and delete everything (WARNING: deletes data!)
docker-compose down -v
```

---

## Where to Go From Here

1. **Full Setup Guide:** [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
2. **API Documentation:** [API.md](./API.md)
3. **Development Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md)
4. **Docker Reference:** [DOCKER_REFERENCE.md](./DOCKER_REFERENCE.md)
5. **API Keys Guide:** [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md)

---

## 🚀 You're Ready!

**Your system is now running. Welcome to the Video Loan System! 🎉**

Questions? Check the documentation files above or restart this guide.

---

⏱️ **Did this in under 30 minutes? You're awesome!** 💪
