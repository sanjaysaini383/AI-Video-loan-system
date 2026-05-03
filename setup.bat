@echo off
REM Setup script for Video Loan System (Windows)

echo 🚀 Setting up Video-Based Digital Loan Origination System

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    exit /b 1
)

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ⚠️  Please update .env with your credentials
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build services
echo 🔨 Building services...
call npm run build

REM Start Docker services
echo 🐳 Starting Docker services...
docker-compose up -d

REM Wait for services
echo ⏳ Waiting for services to become healthy...
timeout /t 10 /nobreak

REM Check service health
echo 🏥 Checking service health...
docker-compose ps

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env with your API keys
echo 2. Run database migrations (if needed): npm run db:migrate
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:5173
echo.
echo 📚 Services running on:
echo    - API Gateway: http://localhost:3000
echo    - Frontend: http://localhost:5173
echo    - PostgreSQL: localhost:5432
echo    - MongoDB: localhost:27017
echo    - Redis: localhost:6379
