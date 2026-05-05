import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

dotenv.config();

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

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP' },
});
app.use('/api/', limiter);

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// JWT middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // For development, allow unauthenticated requests
    (req as any).user = { id: 'dev-user', role: 'customer' };
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Helper: forward request to a service
async function proxyRequest(serviceUrl: string, path: string, method: string, data?: any) {
  try {
    const response = await axios({ method, url: `${serviceUrl}${path}`, data, timeout: 30000 });
    return response.data;
  } catch (error: any) {
    if (error.response) return { error: error.response.data, status: error.response.status };
    return { error: `Service unavailable: ${serviceUrl}`, status: 503 };
  }
}

// Helper: log audit event
async function logAudit(sessionId: string, action: string, details: any, source: string) {
  try {
    await axios.post(`${SERVICES.audit}/log`, { sessionId, action, details, source });
  } catch { /* non-blocking */ }
}

// ===========================
// HEALTH CHECK
// ===========================
app.get('/health', (_req, res) => {
  res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString(), services: Object.keys(SERVICES) });
});

// Health check for all services
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
  res.json({ gateway: 'up', services: checks });
});

// ===========================
// AUTH ENDPOINTS
// ===========================
app.post('/api/auth/token', (req, res) => {
  const { phoneNumber, firstName, lastName } = req.body;
  const userId = `user_${crypto.randomBytes(8).toString('hex')}`;
  const token = jwt.sign({ id: userId, phoneNumber, firstName, lastName, role: 'customer' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, userId, expiresIn: '24h' });
});

// ===========================
// SESSION ENDPOINTS
// ===========================
app.post('/api/sessions', authenticate, async (req: Request, res: Response) => {
  const sessionId = `session_${crypto.randomBytes(12).toString('hex')}`;
  const user = (req as any).user;
  const sessionData = {
    id: sessionId,
    userId: user.id,
    status: 'active',
    startedAt: new Date().toISOString(),
    customerData: req.body,
    location: req.body.location || null,
    deviceInfo: {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      platform: req.body.platform || 'web',
    },
  };

  // Try to store in session service
  try {
    await axios.post(`${SERVICES.session}/sessions`, sessionData, { timeout: 5000 });
  } catch { /* session service may be down, continue */ }

  await logAudit(sessionId, 'SESSION_CREATED', { userId: user.id, ...req.body }, 'api-gateway');
  res.json({ sessionId, ...sessionData });
});

app.get('/api/sessions/:id', authenticate, async (req, res) => {
  try {
    const data = await proxyRequest(SERVICES.session, `/sessions/${req.params.id}`, 'GET');
    res.json(data);
  } catch {
    res.json({ id: req.params.id, status: 'active' });
  }
});

// ===========================
// STT ENDPOINTS
// ===========================
app.post('/api/stt/transcribe', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.stt, '/transcribe', 'POST', req.body);
  if (result.status && result.status >= 400) return res.status(result.status).json(result.error);
  await logAudit(req.body.sessionId, 'STT_COMPLETED', { language: req.body.language }, 'stt-service');
  res.json(result);
});

// ===========================
// VISION ENDPOINTS
// ===========================
app.post('/api/vision/estimate-age', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.vision, '/estimate-age', 'POST', req.body);
  if (result.status && result.status >= 400) return res.status(result.status).json(result.error);
  await logAudit(req.body.session_id, 'AGE_ESTIMATED', result, 'vision-service');
  res.json(result);
});

app.post('/api/vision/liveness', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.vision, '/liveness-detection', 'POST', req.body);
  res.json(result);
});

// ===========================
// KYC ENDPOINTS
// ===========================
app.post('/api/kyc/verify', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.kyc, '/verify', 'POST', req.body);
  res.json(result);
});

app.post('/api/kyc/validate-location', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.kyc, '/validate-location', 'POST', req.body);
  await logAudit(req.body.sessionId, 'LOCATION_VALIDATED', result, 'kyc-service');
  res.json(result);
});

app.post('/api/kyc/consent', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.kyc, '/consent', 'POST', req.body);
  await logAudit(req.body.sessionId, 'CONSENT_RECORDED', { type: req.body.consentType }, 'kyc-service');
  res.json(result);
});

// ===========================
// RISK ENDPOINTS
// ===========================
app.post('/api/risk/assess', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.risk, '/assess', 'POST', req.body);
  if (result.status && result.status >= 400) return res.status(result.status).json(result.error);
  await logAudit(req.body.session_id, 'RISK_ASSESSED', { riskBand: result.risk_band, riskScore: result.risk_score }, 'risk-service');
  res.json(result);
});

// ===========================
// LLM ENDPOINTS
// ===========================
app.post('/api/llm/analyze', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.llm, '/analyze', 'POST', req.body);
  if (result.status && result.status >= 400) return res.status(result.status).json(result.error);
  await logAudit(req.body.session_id, 'LLM_ANALYZED', { classification: result.customer_classification }, 'llm-service');
  res.json(result);
});

// ===========================
// OFFER ENDPOINTS
// ===========================
app.post('/api/offers/generate', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.offer, '/generate', 'POST', req.body);
  await logAudit(req.body.sessionId, 'OFFER_GENERATED', result, 'offer-service');
  res.json(result);
});

app.get('/api/offers/:id', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.offer, `/offer/${req.params.id}`, 'GET');
  res.json(result);
});

app.get('/api/offers', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.offer, '/offers', 'GET');
  res.json(result);
});

app.post('/api/offers/:id/accept', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.offer, `/offer/${req.params.id}/accept`, 'POST');
  await logAudit(req.params.id, 'OFFER_ACCEPTED', { offerId: req.params.id }, 'offer-service');
  res.json(result);
});

// ===========================
// AUDIT ENDPOINTS
// ===========================
app.get('/api/audit/:sessionId', authenticate, async (req, res) => {
  const result = await proxyRequest(SERVICES.audit, `/logs/${req.params.sessionId}`, 'GET');
  res.json(result);
});

// ===========================
// END-TO-END ORCHESTRATION PIPELINE
// ===========================
app.post('/api/sessions/:id/process', authenticate, async (req: Request, res: Response) => {
  const sessionId = req.params.id;
  const { transcript, customerData, location, estimatedAge } = req.body;
  const user = (req as any).user;

  const pipeline: any = {
    sessionId,
    stages: {},
    startedAt: new Date().toISOString(),
  };

  try {
    // Stage 1: LLM Analysis
    pipeline.stages.llm = { status: 'processing' };
    try {
      const llmResult = await axios.post(`${SERVICES.llm}/analyze`, {
        session_id: sessionId,
        transcript: transcript || 'Customer requested a personal loan for home renovation.',
        extracted_data: customerData || {},
      }, { timeout: 30000 });
      pipeline.stages.llm = { status: 'completed', data: llmResult.data };
    } catch (e: any) {
      pipeline.stages.llm = { status: 'simulated', data: {
        customer_classification: 'medium',
        risk_indicators: ['new_customer'],
        confidence: 0.75,
        structured_insights: { employment: customerData?.employmentStatus || 'employed', income_verified: false },
      }};
    }

    // Stage 2: Risk Assessment
    pipeline.stages.risk = { status: 'processing' };
    try {
      const riskResult = await axios.post(`${SERVICES.risk}/assess`, {
        session_id: sessionId,
        user_id: user.id,
        transcript: transcript || '',
        age_estimate: estimatedAge || 30,
        location: location || { lat: 28.6139, lng: 77.2090 },
        employment_status: customerData?.employmentStatus || 'employed',
        monthly_income: parseFloat(customerData?.monthlyIncome) || 50000,
      }, { timeout: 15000 });
      pipeline.stages.risk = { status: 'completed', data: riskResult.data };
    } catch {
      pipeline.stages.risk = { status: 'simulated', data: {
        risk_band: 'low', risk_score: 0.35, propensity_score: 0.78, fraud_indicators: [], reasons: ['Profile verified'],
      }};
    }

    // Stage 3: Offer Generation
    const riskBand = pipeline.stages.risk.data?.risk_band || pipeline.stages.risk.data?.riskBand || 'medium';
    const monthlyIncome = parseFloat(customerData?.monthlyIncome) || 50000;
    pipeline.stages.offer = { status: 'processing' };
    try {
      const offerResult = await axios.post(`${SERVICES.offer}/generate`, {
        sessionId, userId: user.id, riskBand, monthlyIncome,
        employmentStatus: customerData?.employmentStatus || 'employed',
        loanPurpose: customerData?.loanPurpose || 'personal',
      }, { timeout: 15000 });
      pipeline.stages.offer = { status: 'completed', data: offerResult.data };
    } catch {
      // Generate offers locally as fallback
      const maxLoan = monthlyIncome * 40;
      pipeline.stages.offer = { status: 'simulated', data: {
        offers: [
          { loanAmount: maxLoan, tenureMonths: 60, interestRate: 10.5, emi: Math.round(maxLoan * 0.0215), eligibilityStatus: 'approved' },
          { loanAmount: maxLoan * 0.7, tenureMonths: 36, interestRate: 11.0, emi: Math.round(maxLoan * 0.7 * 0.0326), eligibilityStatus: 'approved' },
          { loanAmount: maxLoan * 0.5, tenureMonths: 24, interestRate: 10.0, emi: Math.round(maxLoan * 0.5 * 0.0461), eligibilityStatus: 'approved' },
        ],
      }};
    }

    pipeline.completedAt = new Date().toISOString();
    await logAudit(sessionId, 'PIPELINE_COMPLETED', { stages: Object.keys(pipeline.stages) }, 'api-gateway');

    res.json(pipeline);
  } catch (error: any) {
    console.error('Pipeline error:', error);
    res.status(500).json({ error: 'Pipeline processing failed', details: error.message });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Downstream services:`, Object.entries(SERVICES).map(([k, v]) => `${k}=${v}`).join(', '));
});

export default app;
