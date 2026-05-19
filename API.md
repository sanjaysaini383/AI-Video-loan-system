# API Documentation

## Overview

The LoanVision AI API is organized around REST principles. The API Gateway (port 3000) serves as the central entry point, routing requests to appropriate microservices.

**Base URL:** `http://localhost:3000`

## Authentication

All API endpoints (except `/auth/register` and `/auth/login`) require a JWT token in the Authorization header:

```bash
Authorization: Bearer <YOUR_JWT_TOKEN>
```

## Response Format

All endpoints return JSON with a consistent structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "statusCode": 200
}
```

## Rate Limiting

- **Default:** 100 requests per 15 minutes per IP
- **Headers:** 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests left
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Endpoints

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "phone": "+1234567890",
  "fullName": "John Doe"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "message": "Registration successful"
  }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "expiresIn": "24h",
    "user": {
      "userId": "uuid-here",
      "email": "user@example.com"
    }
  }
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <TOKEN>

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### Onboarding

#### Start Onboarding
```
POST /onboarding/start
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "loanAmount": 100000,
  "purpose": "personal_use"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "videoRoomId": "room-uuid",
    "signalingUrl": "ws://localhost:3001/signal"
  }
}
```

#### Get Onboarding Status
```
GET /onboarding/status?sessionId=<SESSION_ID>
Authorization: Bearer <TOKEN>

Response: 200 OK
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "currentStage": "kyc_verification",
    "progress": {
      "kyc": "completed",
      "risk_check": "in_progress",
      "video_call": "completed",
      "verification": "pending"
    },
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

### Offers

#### Get Loan Offers
```
GET /offers?sessionId=<SESSION_ID>
Authorization: Bearer <TOKEN>

Response: 200 OK
{
  "success": true,
  "data": {
    "offers": [
      {
        "offerId": "offer-uuid",
        "loanAmount": 100000,
        "interestRate": 12.5,
        "tenure": 36,
        "monthlyEMI": 3254.50,
        "totalInterest": 17102,
        "processingFee": 2500,
        "eligibilityScore": 85,
        "validUntil": "2024-01-22T10:30:00Z"
      }
    ]
  }
}
```

#### Accept Offer
```
POST /offers/accept
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "offerId": "offer-uuid",
  "sessionId": "session-uuid"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "applicationId": "app-uuid",
    "status": "approved",
    "message": "Offer accepted successfully"
  }
}
```

---

### Media

#### Upload Video Chunk
```
POST /media/upload
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

Form Data:
- sessionId: session-uuid
- chunk: <binary video data>
- chunkIndex: 1
- totalChunks: 10

Response: 200 OK
{
  "success": true,
  "data": {
    "chunkId": "chunk-uuid",
    "mediaId": "media-uuid",
    "uploadedBytes": 1024000
  }
}
```

#### Get Media Metadata
```
GET /media/metadata/<MEDIA_ID>
Authorization: Bearer <TOKEN>

Response: 200 OK
{
  "success": true,
  "data": {
    "mediaId": "media-uuid",
    "type": "video",
    "duration": 1800,
    "size": 104857600,
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Audit Trail

#### Get Audit Logs
```
GET /audit/trail?userId=<USER_ID>&limit=50
Authorization: Bearer <TOKEN>

Response: 200 OK
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "log-uuid",
        "action": "kyc_verification_completed",
        "timestamp": "2024-01-15T10:30:00Z",
        "details": {
          "verificationResult": "approved",
          "confidence": 0.95
        }
      }
    ],
    "total": 15,
    "page": 1
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "statusCode": 404
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "statusCode": 429,
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "statusCode": 500
}
```

---

## WebSocket Events (Session Service)

Connect to `ws://localhost:3001/signal?sessionId=<SESSION_ID>&token=<JWT_TOKEN>`

### Sending Events

**Offer SDP:**
```json
{
  "type": "offer",
  "sdp": "v=0\no=..."
}
```

**Answer SDP:**
```json
{
  "type": "answer",
  "sdp": "v=0\no=..."
}
```

**ICE Candidate:**
```json
{
  "type": "candidate",
  "candidate": "candidate:842..."
}
```

### Receiving Events

**Offer/Answer received:**
```json
{
  "type": "offer|answer",
  "sdp": "v=0\no=..."
}
```

**Remote ICE Candidate:**
```json
{
  "type": "candidate",
  "candidate": "candidate:842..."
}
```

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "phone": "+1234567890",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Start onboarding (replace TOKEN)
curl -X POST http://localhost:3000/onboarding/start \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 100000,
    "purpose": "personal_use"
  }'
```

### Using Postman

1. Import the collection from `docs/postman-collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `token`: Your JWT token
3. Run requests

---

## Pagination

Endpoints that return lists support pagination:

```bash
GET /audit/trail?page=1&limit=50&sort=-timestamp

Query Parameters:
- page: Page number (default: 1)
- limit: Results per page (default: 20, max: 100)
- sort: Sort field with direction (e.g., -timestamp for descending)
```

---

## Versioning

Current API Version: **v1**

Future versions will be prefixed with `/api/v2`, `/api/v3`, etc.

---

## Support

For API questions or issues:
- 📖 See [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🤝 Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- 🐛 Report bugs on [GitHub Issues](https://github.com/sanjaysaini383/AI-Video-loan-system/issues)
