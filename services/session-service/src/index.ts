import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.SESSION_SERVICE_PORT || 3001;
app.use(express.json());

// ===========================
// REDIS CONNECTION (REQUIRED)
// ===========================
let redisClient: any = null;

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err: any) => console.error('Redis error:', err.message));
    redisClient.on('reconnecting', () => console.log('Redis reconnecting...'));
    await redisClient.connect();
    console.log(`✅ Redis connected: ${redisUrl}`);
  } catch (e: any) {
    console.error(`❌ Redis connection failed: ${e.message}`);
    console.error('Session service requires Redis. Please start Redis with: docker run -d -p 6379:6379 redis:7');
    // Don't exit — allow degraded mode
  }
};
initRedis();

// ===========================
// SESSION CRUD VIA REDIS
// ===========================
async function storeSession(sessionId: string, data: any): Promise<void> {
  if (!redisClient) throw new Error('Redis not available');
  await redisClient.set(`session:${sessionId}`, JSON.stringify(data), { EX: 86400 * 7 });
}

async function getSession(sessionId: string): Promise<any | null> {
  if (!redisClient) return null;
  const raw = await redisClient.get(`session:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

async function deleteSession(sessionId: string): Promise<void> {
  if (!redisClient) return;
  await redisClient.del(`session:${sessionId}`);
}

// ===========================
// REST ENDPOINTS
// ===========================
app.post('/sessions', async (req, res) => {
  try {
    const sessionData = {
      ...req.body,
      id: req.body.id || `session_${Date.now()}`,
      status: 'active',
      startedAt: req.body.startedAt || new Date().toISOString(),
      participants: [],
      events: [],
    };
    await storeSession(sessionData.id, sessionData);
    console.log(`📋 Session created: ${sessionData.id} for user: ${sessionData.userId}`);
    res.json(sessionData);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create session', details: e.message });
  }
});

app.get('/sessions/:id', async (req, res) => {
  const session = await getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.put('/sessions/:id', async (req, res) => {
  const existing = await getSession(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Session not found' });
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  await storeSession(req.params.id, updated);
  res.json(updated);
});

app.post('/sessions/:id/end', async (req, res) => {
  const existing = await getSession(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Session not found' });
  const updated = {
    ...existing,
    status: 'completed',
    endedAt: new Date().toISOString(),
    duration: Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000),
  };
  await storeSession(req.params.id, updated);
  console.log(`✅ Session ended: ${req.params.id} (${updated.duration}s)`);
  res.json(updated);
});

// Add event to session timeline
app.post('/sessions/:id/event', async (req, res) => {
  const existing = await getSession(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Session not found' });
  existing.events = existing.events || [];
  existing.events.push({ ...req.body, timestamp: new Date().toISOString() });
  await storeSession(req.params.id, existing);
  res.json({ message: 'Event recorded', eventCount: existing.events.length });
});

// ===========================
// SOCKET.IO — REAL-TIME SIGNALING
// ===========================
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-session', async (sessionId: string) => {
    socket.join(sessionId);
    console.log(`📡 ${socket.id} joined session ${sessionId}`);

    const session = await getSession(sessionId);
    if (session) {
      session.participants = session.participants || [];
      session.participants.push({ socketId: socket.id, joinedAt: new Date().toISOString() });
      await storeSession(sessionId, session);
    }

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
    // Also store in Redis
    if (redisClient) {
      redisClient.lPush(`transcript-events:${sessionId}`, JSON.stringify({ ...data, timestamp: new Date().toISOString() }))
        .catch(() => { });
    }
  });

  // Consent event
  socket.on('consent-given', async (sessionId: string, data: any) => {
    const consent = { ...data, timestamp: new Date().toISOString() };
    io.to(sessionId).emit('consent-recorded', consent);
    if (redisClient) {
      await redisClient.lPush(`consent:${sessionId}`, JSON.stringify(consent));
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'Session Service running',
    redis: redisClient ? 'connected' : 'disconnected',
    activeSockets: io.engine.clientsCount,
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Session Service running on port ${PORT}`);
});

export default server;
