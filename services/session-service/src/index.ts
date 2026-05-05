import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.SESSION_SERVICE_PORT || 3001;
app.use(express.json());

// Redis client for session storage (with in-memory fallback)
let redisClient: any = null;
const memoryStore: Record<string, any> = {};

const initRedis = async () => {
  try {
    redisClient = Redis.createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', () => { redisClient = null; });
    await redisClient.connect();
    console.log('✅ Connected to Redis');
  } catch {
    console.log('⚠️  Redis unavailable, using in-memory store');
    redisClient = null;
  }
};
initRedis();

// Storage helpers
async function storeSession(key: string, data: any): Promise<void> {
  const json = JSON.stringify(data);
  if (redisClient) {
    await redisClient.set(key, json, { EX: 86400 }); // 24h TTL
  } else {
    memoryStore[key] = json;
  }
}

async function getSession(key: string): Promise<any | null> {
  let raw: string | null = null;
  if (redisClient) {
    raw = await redisClient.get(key);
  } else {
    raw = memoryStore[key] || null;
  }
  return raw ? JSON.parse(raw) : null;
}

async function getAllSessions(): Promise<any[]> {
  const sessions: any[] = [];
  if (redisClient) {
    const keys = await redisClient.keys('session:*');
    for (const key of keys) {
      const data = await redisClient.get(key);
      if (data) sessions.push(JSON.parse(data));
    }
  } else {
    for (const [key, val] of Object.entries(memoryStore)) {
      if (key.startsWith('session:')) sessions.push(JSON.parse(val));
    }
  }
  return sessions;
}

// ===========================
// REST ENDPOINTS
// ===========================

// Create session
app.post('/sessions', async (req, res) => {
  const sessionData = {
    ...req.body,
    id: req.body.id || `session_${Date.now()}`,
    status: 'active',
    startedAt: new Date().toISOString(),
    participants: [],
  };
  await storeSession(`session:${sessionData.id}`, sessionData);
  console.log(`📋 Session created: ${sessionData.id}`);
  res.json(sessionData);
});

// Get session by ID
app.get('/sessions/:id', async (req, res) => {
  const session = await getSession(`session:${req.params.id}`);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// List all sessions
app.get('/sessions', async (_req, res) => {
  const sessions = await getAllSessions();
  res.json(sessions);
});

// Update session
app.put('/sessions/:id', async (req, res) => {
  const existing = await getSession(`session:${req.params.id}`);
  if (!existing) return res.status(404).json({ error: 'Session not found' });
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  await storeSession(`session:${req.params.id}`, updated);
  res.json(updated);
});

// End session
app.post('/sessions/:id/end', async (req, res) => {
  const existing = await getSession(`session:${req.params.id}`);
  if (!existing) return res.status(404).json({ error: 'Session not found' });
  const updated = { ...existing, status: 'completed', endedAt: new Date().toISOString(), duration: Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000) };
  await storeSession(`session:${req.params.id}`, updated);
  console.log(`✅ Session ended: ${req.params.id}`);
  res.json(updated);
});

// ===========================
// SOCKET.IO - WebRTC SIGNALING
// ===========================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join-session', async (sessionId: string) => {
    socket.join(sessionId);
    console.log(`📡 Socket ${socket.id} joined session ${sessionId}`);

    // Update session participants
    const session = await getSession(`session:${sessionId}`);
    if (session) {
      session.participants = session.participants || [];
      session.participants.push({ socketId: socket.id, joinedAt: new Date().toISOString() });
      await storeSession(`session:${sessionId}`, session);
    }

    // Notify others in the session
    socket.to(sessionId).emit('peer-joined', { socketId: socket.id });
  });

  // WebRTC signaling
  socket.on('sdp-offer', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('sdp-offer', data);
  });

  socket.on('sdp-answer', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('sdp-answer', data);
  });

  socket.on('ice-candidate', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('ice-candidate', data);
  });

  // Real-time transcript sharing
  socket.on('transcript-update', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('transcript-update', data);
  });

  // Consent event
  socket.on('consent-given', async (sessionId: string, data: any) => {
    io.to(sessionId).emit('consent-recorded', { ...data, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', async () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'Session Service is running', redis: redisClient ? 'connected' : 'in-memory', activeSockets: io.engine.clientsCount });
});

server.listen(PORT, () => {
  console.log(`🚀 Session Service running on port ${PORT}`);
});

export default server;
