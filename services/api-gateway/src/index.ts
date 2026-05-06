import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createClient } from 'redis';
import * as db from './db';

dotenv.config({ path: '../../.env' });

const app: Express = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Service URLs
const SERVICES = {
  session: process.env.SESSION_SERVICE_URL || 'http://localhost:3001',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3002',
  stt: process.env.STT_SERVICE_URL || 'http://localhost:3003',
  kyc: process.env.KYC_SERVICE_URL || 'http://localhost:3004',
  risk: process.env.RISK_SERVICE_URL || 'http://localhost:3005',
  vision: process.env.VISION_SERVICE_URL || 'http://localhost:3006',
  llm: process.env.LLM_SERVICE_URL || 'http://localhost:3007',
  offer: process.env.OFFER_SERVICE_URL || 'http://localhost:3008',
  audit: process.env.AUDIT_SERVICE_URL || 'http://localhost:3009',
};

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is required. Set it in .env');
  process.exit(1);
}

// ===========================
// REDIS TOKEN STORE
// ===========================
let redisClient: any = null;
const tokenBlacklist = new Set<string>();

const initRedis = async () => {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', (err: any) => console.error('Redis error:', err.message));
    await redisClient.connect();
    console.log('✅ Redis connected for token/session store');
  } catch (e: any) {
    console.warn('⚠️  Redis unavailable:', e.message);
    redisClient = null;
  }

  // Initialize Prisma (PostgreSQL)
  await db.initPrisma();
};
initRedis();

// ===========================
// MIDDLEWARE
// ===========================
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Global rate limiting: 100 req per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Stricter rate limit for auth endpoints: 10 req per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts. Try again later.' },
});

// ===========================
// JWT AUTH MIDDLEWARE
// ===========================
interface JWTPayload {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: string;
  iat?: number;
  exp?: number;
}

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header. Use: Bearer <token>' });
  }

  const token = authHeader.split(' ')[1];

  // Check blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  // Check Redis blacklist
  if (redisClient) {
    try {
      const revoked = await redisClient.get(`blacklist:${token}`);
      if (revoked) return res.status(401).json({ error: 'Token has been revoked' });
    } catch { }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as any).user = decoded;
    (req as any).token = token;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please re-authenticate.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ===========================
// PROXY HELPER
// ===========================
async function proxyRequest(serviceUrl: string, path: string, method: string, data?: any, timeout = 30000) {
  try {
    const response = await axios({ method, url: `${serviceUrl}${path}`, data, timeout });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(`Service error [${serviceUrl}${path}]:`, error.response.status, error.response.data);
      return { _error: true, status: error.response.status, data: error.response.data };
    }
    console.error(`Service unavailable [${serviceUrl}${path}]:`, error.message);
    return { _error: true, status: 503, data: { error: `Service unavailable: ${serviceUrl}` } };
  }
}

function handleProxy(res: Response, result: any) {
  if (result._error) return res.status(result.status).json(result.data);
  return res.json(result);
}

// Audit helper (non-blocking)
function logAudit(sessionId: string, userId: string, action: string, details: any, source: string) {
  axios.post(`${SERVICES.audit}/log`, { sessionId, userId, action, details, source, timestamp: new Date().toISOString() })
    .catch(() => { }); // non-blocking
}

// ===========================
// HEALTH
// ===========================
app.get('/health', (_req, res) => {
  res.json({
    status: 'API Gateway running',
    timestamp: new Date().toISOString(),
    redis: redisClient ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV,
  });
});

app.get('/api/health/all', async (_req, res) => {
  const checks: Record<string, any> = {};
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const resp = await axios.get(`${url}/health`, { timeout: 3000 });
      checks[name] = { status: 'up', data: resp.data };
    } catch {
      checks[name] = { status: 'down' };
    }
  }
  res.json({ gateway: 'up', redis: redisClient ? 'up' : 'down', services: checks });
});

// ===========================
// AUTH (with rate limiting)
// ===========================
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  const { phoneNumber, firstName, lastName } = req.body;

  if (!phoneNumber || !firstName) {
    return res.status(400).json({ error: 'phoneNumber and firstName are required' });
  }

  const userId = `user_${crypto.randomBytes(12).toString('hex')}`;

  // Store user in Redis (cache)
  const userData = { id: userId, phoneNumber, firstName, lastName: lastName || '', createdAt: new Date().toISOString() };
  if (redisClient) {
    await redisClient.set(`user:${userId}`, JSON.stringify(userData), { EX: 86400 * 30 });
    await redisClient.set(`phone:${phoneNumber}`, userId, { EX: 86400 * 30 });
  }

  // Persist user to PostgreSQL
  await db.createUser({ id: userId, phoneNumber, firstName, lastName });

  const token = jwt.sign(
    { id: userId, phoneNumber, firstName, lastName: lastName || '', role: 'customer' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY as any }
  );

  // Store token in Redis for tracking
  if (redisClient) {
    await redisClient.set(`token:${userId}`, token, { EX: 86400 });
  }

  logAudit('system', userId, 'USER_REGISTERED', { phoneNumber }, 'api-gateway');

  res.json({ token, userId, expiresIn: JWT_EXPIRY, user: userData });
});

app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required' });

  let userId: string | null = null;
  let userData: any = null;

  // Look up user by phone — try Redis cache first, then PostgreSQL
  if (redisClient) {
    userId = await redisClient.get(`phone:${phoneNumber}`);
    if (userId) {
      const raw = await redisClient.get(`user:${userId}`);
      if (raw) userData = JSON.parse(raw);
    }
  }

  // Fallback to PostgreSQL if not in Redis
  if (!userId || !userData) {
    const dbUser = await db.getUserByPhone(phoneNumber);
    if (dbUser) {
      userId = dbUser.id;
      userData = dbUser;
      // Re-cache in Redis
      if (redisClient) {
        await redisClient.set(`user:${userId}`, JSON.stringify(userData), { EX: 86400 * 30 });
        await redisClient.set(`phone:${phoneNumber}`, userId, { EX: 86400 * 30 });
      }
    }
  }

  if (!userId || !userData) {
    return res.status(404).json({ error: 'User not found. Register first.' });
  }

  const token = jwt.sign(
    { id: userId, phoneNumber, firstName: userData.firstName, lastName: userData.lastName, role: 'customer' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY as any }
  );

  if (redisClient) {
    await redisClient.set(`token:${userId}`, token, { EX: 86400 });
  }

  logAudit('system', userId, 'USER_LOGIN', { phoneNumber }, 'api-gateway');
  res.json({ token, userId, expiresIn: JWT_EXPIRY, user: userData });
});

app.post('/api/auth/logout', authenticate, async (req: Request, res: Response) => {
  const token = (req as any).token;
  const user = (req as any).user;

  // Blacklist the token
  tokenBlacklist.add(token);
  if (redisClient) {
    await redisClient.set(`blacklist:${token}`, '1', { EX: 86400 });
    await redisClient.del(`token:${user.id}`);
  }

  logAudit('system', user.id, 'USER_LOGOUT', {}, 'api-gateway');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/refresh', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const oldToken = (req as any).token;

  // Blacklist old token
  tokenBlacklist.add(oldToken);
  if (redisClient) await redisClient.set(`blacklist:${oldToken}`, '1', { EX: 86400 });

  const newToken = jwt.sign(
    { id: user.id, phoneNumber: user.phoneNumber, firstName: user.firstName, lastName: user.lastName, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY as any }
  );

  if (redisClient) await redisClient.set(`token:${user.id}`, newToken, { EX: 86400 });
  res.json({ token: newToken, expiresIn: JWT_EXPIRY });
});

// ===========================
// SESSION ENDPOINTS
// ===========================
app.post('/api/sessions', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const sessionId = `session_${crypto.randomBytes(16).toString('hex')}`;

  const sessionData = {
    id: sessionId,
    userId: user.id,
    customerName: `${user.firstName} ${user.lastName}`.trim(),
    status: 'active',
    startedAt: new Date().toISOString(),
    customerData: req.body,
    location: req.body.location || null,
    deviceInfo: { userAgent: req.headers['user-agent'], ip: req.ip, platform: req.body.platform || 'web' },
  };

  // Store session in Redis (cache for real-time access)
  if (redisClient) {
    await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionData), { EX: 86400 });
    await redisClient.lPush(`user-sessions:${user.id}`, sessionId);
    await redisClient.expire(`user-sessions:${user.id}`, 86400 * 7);
  }

  // Persist session to PostgreSQL
  await db.createSession({
    id: sessionId,
    userId: user.id,
    latitude: req.body.location?.latitude,
    longitude: req.body.location?.longitude,
    userAgent: req.headers['user-agent'] as string,
    ipAddress: req.ip,
    platform: req.body.platform || 'web',
  });

  // Update user with employment/income data
  await db.createUser({
    id: user.id,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    employmentStatus: req.body.employmentStatus,
    monthlyIncome: parseFloat(req.body.monthlyIncome) || undefined,
    loanPurpose: req.body.loanPurpose,
  });

  // Forward to session service
  const result = await proxyRequest(SERVICES.session, '/sessions', 'POST', sessionData);
  logAudit(sessionId, user.id, 'SESSION_CREATED', { location: req.body.location }, 'api-gateway');

  res.json({ sessionId, ...sessionData });
});

app.get('/api/sessions/:id', authenticate, async (req: Request, res: Response) => {
  // Try Redis first
  if (redisClient) {
    const raw = await redisClient.get(`session:${req.params.id}`);
    if (raw) return res.json(JSON.parse(raw));
  }
  // Fallback to session service
  const result = await proxyRequest(SERVICES.session, `/sessions/${req.params.id}`, 'GET');
  handleProxy(res, result);
});

app.get('/api/sessions', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const sessions: any[] = [];

  if (redisClient) {
    const ids = await redisClient.lRange(`user-sessions:${user.id}`, 0, -1);
    for (const id of ids) {
      const raw = await redisClient.get(`session:${id}`);
      if (raw) sessions.push(JSON.parse(raw));
    }
  }

  res.json({ sessions, count: sessions.length });
});

app.post('/api/sessions/:id/end', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const sessionId = req.params.id;

  if (redisClient) {
    const raw = await redisClient.get(`session:${sessionId}`);
    if (raw) {
      const session = JSON.parse(raw);
      session.status = 'completed';
      session.endedAt = new Date().toISOString();
      session.duration = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
      await redisClient.set(`session:${sessionId}`, JSON.stringify(session), { EX: 86400 * 7 });
      logAudit(sessionId, user.id, 'SESSION_ENDED', { duration: session.duration }, 'api-gateway');
      return res.json(session);
    }
  }

  const result = await proxyRequest(SERVICES.session, `/sessions/${sessionId}/end`, 'POST');
  handleProxy(res, result);
});

// ===========================
// STT ENDPOINTS (real Deepgram)
// ===========================
app.post('/api/stt/transcribe', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.stt, '/transcribe', 'POST', req.body);
  if (result._error) return handleProxy(res, result);

  // Store transcript in Redis
  if (redisClient && req.body.sessionId) {
    await redisClient.set(`transcript:${req.body.sessionId}`, JSON.stringify(result), { EX: 86400 * 7 });
  }

  logAudit(req.body.sessionId, user.id, 'STT_TRANSCRIPTION_COMPLETED', {
    source: result.source, confidence: result.transcript?.confidence, language: result.transcript?.language,
  }, 'stt-service');

  res.json(result);
});

// ===========================
// VISION ENDPOINTS
// ===========================
app.post('/api/vision/estimate-age', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.vision, '/estimate-age', 'POST', req.body);
  if (result._error) return handleProxy(res, result);

  // Store age estimation in Redis
  if (redisClient && req.body.session_id) {
    await redisClient.set(`age:${req.body.session_id}`, JSON.stringify(result), { EX: 86400 });
  }

  logAudit(req.body.session_id, user.id, 'AGE_ESTIMATED', {
    estimatedAge: result.estimated_age, confidence: result.confidence, liveness: result.liveness_score,
  }, 'vision-service');

  res.json(result);
});

app.post('/api/vision/liveness', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.vision, '/liveness-detection', 'POST', req.body);
  handleProxy(res, result);
});

// ===========================
// KYC ENDPOINTS
// ===========================
app.post('/api/kyc/validate-location', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.kyc, '/validate-location', 'POST', req.body);
  if (result._error) return handleProxy(res, result);

  logAudit(req.body.sessionId, user.id, 'LOCATION_VALIDATED', {
    valid: result.valid, riskLevel: result.riskLevel, fraudSignals: result.fraudSignals,
  }, 'kyc-service');

  res.json(result);
});

app.post('/api/kyc/consent', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.kyc, '/consent', 'POST', { ...req.body, userId: user.id });
  if (result._error) return handleProxy(res, result);

  // Store consent in Redis
  if (redisClient && req.body.sessionId) {
    await redisClient.lPush(`consent:${req.body.sessionId}`, JSON.stringify(result));
    await redisClient.expire(`consent:${req.body.sessionId}`, 86400 * 30);
  }

  logAudit(req.body.sessionId, user.id, 'CONSENT_RECORDED', {
    consentType: req.body.consentType, verballyAgreed: req.body.verballyAgreed,
  }, 'kyc-service');

  res.json(result);
});

app.post('/api/kyc/verify-age', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.kyc, '/verify-age', 'POST', req.body);
  handleProxy(res, result);
});

app.get('/api/kyc/status/:sessionId', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.kyc, `/status/${req.params.sessionId}`, 'GET');
  handleProxy(res, result);
});

// ===========================
// RISK ENDPOINTS
// ===========================
app.post('/api/risk/assess', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.risk, '/assess', 'POST', { ...req.body, user_id: user.id });
  if (result._error) return handleProxy(res, result);

  // Store risk assessment in Redis
  if (redisClient && req.body.session_id) {
    await redisClient.set(`risk:${req.body.session_id}`, JSON.stringify(result), { EX: 86400 * 7 });
  }

  logAudit(req.body.session_id, user.id, 'RISK_ASSESSED', {
    riskBand: result.risk_band, riskScore: result.risk_score, bureauScore: result.bureau_score,
    fraudIndicators: result.fraud_indicators,
  }, 'risk-service');

  res.json(result);
});

// ===========================
// LLM ENDPOINTS (real Groq)
// ===========================
app.post('/api/llm/analyze', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.llm, '/analyze', 'POST', req.body, 60000);
  if (result._error) return handleProxy(res, result);

  // Store LLM analysis in Redis
  if (redisClient && req.body.session_id) {
    await redisClient.set(`llm:${req.body.session_id}`, JSON.stringify(result), { EX: 86400 * 7 });
  }

  logAudit(req.body.session_id, user.id, 'LLM_ANALYSIS_COMPLETED', {
    classification: result.customer_classification, confidence: result.confidence,
    provider: result.structured_insights?.llm_provider,
  }, 'llm-service');

  res.json(result);
});

// ===========================
// OFFER ENDPOINTS
// ===========================
app.post('/api/offers/generate', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.offer, '/generate', 'POST', { ...req.body, userId: user.id });
  if (result._error) return handleProxy(res, result);

  // Store offers in Redis
  if (redisClient && req.body.sessionId) {
    await redisClient.set(`offers:${req.body.sessionId}`, JSON.stringify(result), { EX: 86400 * 7 });
  }

  logAudit(req.body.sessionId, user.id, 'OFFERS_GENERATED', {
    offerCount: result.offerCount, riskBand: req.body.riskBand,
  }, 'offer-service');

  res.json(result);
});

app.get('/api/offers', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.offer, '/offers', 'GET');
  handleProxy(res, result);
});

app.get('/api/offers/:id', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.offer, `/offer/${req.params.id}`, 'GET');
  handleProxy(res, result);
});

app.post('/api/offers/:id/accept', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await proxyRequest(SERVICES.offer, `/offer/${req.params.id}/accept`, 'POST');
  if (result._error) return handleProxy(res, result);

  logAudit(req.params.id, user.id, 'OFFER_ACCEPTED', { offerId: req.params.id }, 'offer-service');
  res.json(result);
});

// ===========================
// AUDIT ENDPOINTS
// ===========================
app.get('/api/audit/:sessionId', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.audit, `/logs/${req.params.sessionId}`, 'GET');
  handleProxy(res, result);
});

app.get('/api/audit/consent/:sessionId', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.audit, `/consent/${req.params.sessionId}`, 'GET');
  handleProxy(res, result);
});

app.get('/api/audit/decisions/:sessionId', authenticate, async (req: Request, res: Response) => {
  const result = await proxyRequest(SERVICES.audit, `/decisions/${req.params.sessionId}`, 'GET');
  handleProxy(res, result);
});

// ===========================
// END-TO-END PIPELINE
// ===========================
app.post('/api/sessions/:id/process', authenticate, async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const { transcript, customerData, location, estimatedAge } = req.body;
  const user = (req as any).user;

  const pipeline: any = { sessionId, userId: user.id, stages: {}, startedAt: new Date().toISOString() };

  logAudit(sessionId, user.id, 'PIPELINE_STARTED', { stages: ['llm', 'risk', 'offer'] }, 'api-gateway');

  // Stage 1: LLM Analysis (Groq — real API)
  try {
    const llmResult = await axios.post(`${SERVICES.llm}/analyze`, {
      session_id: sessionId,
      transcript: transcript || '',
      extracted_data: customerData || {},
    }, { timeout: 60000 });
    pipeline.stages.llm = { status: 'completed', data: llmResult.data };
  } catch (e: any) {
    pipeline.stages.llm = { status: 'failed', error: e.response?.data?.detail || e.message };
  }

  // Stage 2: Risk Assessment
  try {
    const riskResult = await axios.post(`${SERVICES.risk}/assess`, {
      session_id: sessionId,
      user_id: user.id,
      transcript: transcript || '',
      age_estimate: estimatedAge || 30,
      location: location || {},
      employment_status: customerData?.employmentStatus || 'employed',
      monthly_income: parseFloat(customerData?.monthlyIncome) || 50000,
      loan_purpose: customerData?.loanPurpose || 'personal',
    }, { timeout: 15000 });
    pipeline.stages.risk = { status: 'completed', data: riskResult.data };
  } catch (e: any) {
    pipeline.stages.risk = { status: 'failed', error: e.response?.data?.detail || e.message };
  }

  // Stage 3: Offer Generation
  const riskBand = pipeline.stages.risk?.data?.risk_band || 'medium';
  const monthlyIncome = parseFloat(customerData?.monthlyIncome) || 50000;
  try {
    const offerResult = await axios.post(`${SERVICES.offer}/generate`, {
      sessionId, userId: user.id, riskBand, monthlyIncome,
      employmentStatus: customerData?.employmentStatus || 'employed',
      loanPurpose: customerData?.loanPurpose || 'personal',
    }, { timeout: 15000 });
    pipeline.stages.offer = { status: 'completed', data: offerResult.data };
  } catch (e: any) {
    pipeline.stages.offer = { status: 'failed', error: e.response?.data?.detail || e.message };
  }

  pipeline.completedAt = new Date().toISOString();
  pipeline.duration = `${Date.now() - new Date(pipeline.startedAt).getTime()}ms`;

  // Store full pipeline result in Redis (cache)
  if (redisClient) {
    await redisClient.set(`pipeline:${sessionId}`, JSON.stringify(pipeline), { EX: 86400 * 7 });
  }

  // Persist pipeline results to PostgreSQL
  await db.updateSession(sessionId, {
    transcript: transcript || null,
    llmResult: pipeline.stages.llm?.data || null,
    riskResult: pipeline.stages.risk?.data || null,
    pipelineResult: pipeline,
  });

  // Persist offers to PostgreSQL
  const generatedOffers = pipeline.stages.offer?.data?.offers || [];
  if (generatedOffers.length > 0) {
    await db.saveOffers(generatedOffers, sessionId, user.id);
  }

  logAudit(sessionId, user.id, 'PIPELINE_COMPLETED', {
    stageResults: Object.fromEntries(Object.entries(pipeline.stages).map(([k, v]: any) => [k, v.status])),
    duration: pipeline.duration,
    offersGenerated: generatedOffers.length,
  }, 'api-gateway');

  res.json(pipeline);
});

// ===========================
// ERROR HANDLING
// ===========================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`🔐 JWT: ${JWT_SECRET ? 'configured' : 'MISSING!'}`);
  console.log(`🗄️  PostgreSQL: ${process.env.DATABASE_URL ? 'configured' : 'not configured (Prisma disabled)'}`);
  console.log(`📡 Services:`, Object.entries(SERVICES).map(([k, v]) => `${k}→${v}`).join(' | '));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await db.disconnectPrisma();
  process.exit(0);
});

export default app;
