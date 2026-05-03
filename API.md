# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Endpoints

### Sessions API

#### Create Session
```
POST /sessions
Content-Type: application/json

{
  "phoneNumber": "9876543210",
  "firstName": "John",
  "lastName": "Doe",
  "employmentStatus": "employed",
  "monthlyIncome": 50000,
  "loanPurpose": "personal"
}

Response:
{
  "sessionId": "session_abc123",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Session
```
GET /sessions/{sessionId}

Response:
{
  "id": "session_abc123",
  "customerId": "user_123",
  "status": "active",
  "startedAt": "2024-01-15T10:30:00Z",
  "location": {
    "latitude": 28.7041,
    "longitude": 77.1025
  },
  "videoUrl": "s3://video-loan-recordings/videos/..."
}
```

### Offers API

#### Generate Offer
```
POST /offers/generate
Content-Type: application/json

{
  "sessionId": "session_abc123",
  "userId": "user_123",
  "riskBand": "low"
}

Response:
{
  "jobId": "job_456",
  "message": "Offer generation queued"
}
```

#### Get Offer
```
GET /offers/{offerId}

Response:
{
  "id": "offer_123",
  "loanAmount": 250000,
  "tenureMonths": 60,
  "interestRate": 12.5,
  "emi": 5500,
  "eligibilityStatus": "approved",
  "generatedAt": "2024-01-15T10:35:00Z",
  "expiresAt": "2024-01-16T10:35:00Z"
}
```

#### Accept Offer
```
POST /offers/{offerId}/accept

Response:
{
  "message": "Offer accepted",
  "loanApplicationId": "app_789"
}
```

### Audit API

#### Log Event
```
POST /audit/log
Content-Type: application/json

{
  "sessionId": "session_abc123",
  "action": "video_call_completed",
  "details": {
    "duration": 300,
    "transcript": "..."
  }
}
```

#### Get Session Logs
```
GET /audit/logs/{sessionId}

Response:
[
  {
    "id": "log_1",
    "action": "session_initiated",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  {
    "id": "log_2",
    "action": "video_call_completed",
    "timestamp": "2024-01-15T10:40:00Z"
  }
]
```

## WebSocket Events (Session Service)

### Connection
```
io.connect('http://localhost:3001')
socket.emit('join-session', sessionId)
```

### Video Signaling
```
// Send SDP offer
socket.emit('sdp-offer', sessionId, sdpData)

// Receive SDP offer
socket.on('sdp-offer', (data) => { ... })

// Send ICE candidate
socket.emit('ice-candidate', sessionId, candidateData)

// Receive ICE candidate
socket.on('ice-candidate', (data) => { ... })
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

### Common Status Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

API Gateway enforces rate limiting:
- **100 requests per 15 minutes** per IP address

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705330200
```

## Example Flow

```
1. Create Session (GET /sessions)
2. Establish WebRTC Connection (WebSocket)
3. Record Video Call (Media Service)
4. Get Session Details (GET /sessions/{id})
5. Generate Offer (POST /offers/generate)
6. View Offers (GET /offers)
7. Accept Offer (POST /offers/{id}/accept)
8. View Audit Trail (GET /audit/logs/{sessionId})
```

---

For more details, refer to individual service documentation.
