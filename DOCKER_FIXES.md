# Docker Fixes - Side-by-Side Comparison

## ❌ Current Dockerfiles (ALL 7 Node.js Services)

All Node.js services have the SAME issues:

### services/api-gateway/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm config set fetch-timeout 120000 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install --verbose || npm install --verbose || npm install --verbose

COPY . .
RUN npm run build 2>/dev/null || true    ← ❌ ISSUE 1: Errors hidden
                                          ← ❌ ISSUE 2: No package-lock.json

EXPOSE 3000
CMD ["npm", "start"]
```

---

## ✅ Corrected Dockerfiles (Recommended)

### For ALL Node.js services (api-gateway, session-service, media-service, stt-service, kyc-service, offer-service, audit-service)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with proper error handling
RUN npm ci --verbose

# Copy source code
COPY . .

# Build TypeScript - DON'T suppress errors
RUN npm run build

# Expose port (varies per service: 3000, 3001, 3002, etc.)
EXPOSE 3000

# Use built version in production, dev in docker-compose
CMD ["npm", "start"]
```

---

## Detailed Changes Required

### Issue 1: Remove Error Suppression
```
Before: RUN npm run build 2>/dev/null || true
After:  RUN npm run build
```
- **Why:** Reveals TypeScript compilation errors
- **Impact:** Broken code won't get deployed

### Issue 2: Replace npm install with npm ci
```
Before: RUN npm config set ... npm install --verbose || npm install --verbose || npm install --verbose
After:  RUN npm ci --verbose
```
- **Why:** `npm ci` (clean install) is deterministic and faster
- **Impact:** Eliminates redundant retry logic, 20-30% faster builds

### Issue 3: Add package-lock.json to COPY
```
Before: COPY package.json ./
After:  COPY package*.json ./
```
- **Why:** Ensures exact dependency versions across builds
- **Impact:** Non-deterministic builds prevented

### Issue 4: Remove unnecessary npm config
```
Before: npm config set fetch-timeout 120000 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000
After:  (removed - npm ci handles this better)
```

---

## Create .dockerignore Files

Add to each service directory: `services/api-gateway/.dockerignore`

```
node_modules
dist
build
.git
.gitignore
.dockerignore
README.md
.env
.env.local
.npm
.eslintcache
*.log
coverage
.DS_Store
```

---

## Python Services - Minor Issues

### services/risk-service/Dockerfile ✓ CORRECT
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3005
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3005"]
```

**Note:** Missing `--reload` in Dockerfile is GOOD! 
(But it's in docker-compose.yml which should be removed)

---

### services/vision-service/Dockerfile ✓ CORRECT
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3006
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3006"]
```

**Note:** This correctly handles system dependencies!
(Other Python services should do the same if needed)

---

### services/llm-service/Dockerfile ✓ CORRECT
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3007
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3007"]
```

---

## docker-compose.yml - Changes Needed

### Issue: Services override Dockerfile CMD with npm run dev

```yaml
# Current (in docker-compose.yml for all Node.js services):
command: npm run dev

# Should be (for production readiness):
# (Remove the command override, use Dockerfile CMD)
```

**Why:** 
- `npm run dev` uses ts-node which is slower in containers
- Dockerfile already has `npm start` which uses compiled dist/
- For development, keeping `npm run dev` is fine, but it masks the issue

---

### Issue: Hardcoded Credentials

```yaml
# CURRENT (Line ~19):
postgres:
  environment:
    POSTGRES_PASSWORD: password        ← ❌ Hardcoded

# SHOULD BE:
postgres:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

```yaml
# CURRENT (Line ~33):
mongo:
  environment:
    MONGO_INITDB_ROOT_PASSWORD: password    ← ❌ Hardcoded

# SHOULD BE:
mongo:
  environment:
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
```

Then create `.env` file:
```
POSTGRES_PASSWORD=your_secure_password_here
MONGO_PASSWORD=your_secure_password_here
```

---

## Actual file changes needed - Node.js Services (7 total)

### 1. services/api-gateway/Dockerfile
```diff
  FROM node:18-alpine
  WORKDIR /app
- COPY package.json ./
+ COPY package*.json ./
- RUN npm config set fetch-timeout 120000 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000 && npm install --verbose || npm install --verbose || npm install --verbose
+ RUN npm ci --verbose
  COPY . .
- RUN npm run build 2>/dev/null || true
+ RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
```

### 2. services/session-service/Dockerfile
[Same changes as above, change EXPOSE to 3001]

### 3. services/media-service/Dockerfile
[Same changes as above, change EXPOSE to 3002]

### 4. services/stt-service/Dockerfile
[Same changes as above, change EXPOSE to 3003]

### 5. services/kyc-service/Dockerfile
[Same changes as above, change EXPOSE to 3004]

### 6. services/offer-service/Dockerfile
[Same changes as above, change EXPOSE to 3008]

### 7. services/audit-service/Dockerfile
[Same changes as above, change EXPOSE to 3009]

---

## Testing the Fixes

### Step 1: Build without error suppression
```bash
cd services/api-gateway
docker build -t api-gateway:test .
```

If any TypeScript errors exist, this will show them (good!).

### Step 2: Verify package-lock.json is used
```bash
docker build --progress=plain -t api-gateway:test . 2>&1 | grep -i "package-lock"
```

Should see npm recognizing package-lock.json.

### Step 3: Check image size reduction
```bash
# Before fixes: ~500-600MB (due to node_modules in image)
# After fixes: ~350-400MB (with .dockerignore)
docker images | grep api-gateway
```

---

## Summary of All Fixes

| Issue | File Type | Fix | Benefit |
|-------|-----------|-----|---------|
| Error suppression | Dockerfile | Remove `2>/dev/null \|\| true` | Catch build errors |
| Redundant retries | Dockerfile | Use `npm ci` instead of `npm install` | 20-30% faster |
| Missing lock file | Dockerfile | Add `package*.json` to COPY | Deterministic builds |
| Bloated images | .dockerignore | Create file with node_modules pattern | Smaller images |
| Hardcoded credentials | docker-compose.yml | Use ${VAR} substitution | Better security |
| Override CMD | docker-compose.yml | Remove command line for prod | Matches Dockerfile intent |

---

## Priority Order

1. **CRITICAL:** Fix `RUN npm run build 2>/dev/null || true` → `RUN npm run build`
   - Takes 1 minute per file × 7 files = 7 minutes
   
2. **HIGH:** Replace npm install with npm ci
   - Takes 1 minute per file × 7 files = 7 minutes

3. **HIGH:** Add package-lock.json to COPY
   - Takes 30 seconds per file × 7 files = 3.5 minutes

4. **MEDIUM:** Create .dockerignore files
   - Takes 1 minute per service × 10 services = 10 minutes

5. **MEDIUM:** Fix hardcoded credentials
   - docker-compose.yml changes = 5 minutes

**Total Time: ~35 minutes to fix all issues**
