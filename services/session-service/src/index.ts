import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.SESSION_SERVICE_PORT || 3001;

// Redis client for session storage
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect();

// Socket.io event handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-session', async (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
    
    // Store in Redis
    await redisClient.set(`session:${sessionId}`, JSON.stringify({
      socketId: socket.id,
      joinedAt: new Date(),
    }));
  });

  socket.on('sdp-offer', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('sdp-offer', data);
  });

  socket.on('sdp-answer', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('sdp-answer', data);
  });

  socket.on('ice-candidate', (sessionId: string, data: any) => {
    socket.to(sessionId).emit('ice-candidate', data);
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up Redis entries
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'Session Service is running' });
});

server.listen(PORT, () => {
  console.log(`🚀 Session Service running on port ${PORT}`);
});

export default server;
