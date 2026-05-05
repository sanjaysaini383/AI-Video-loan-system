import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.AUDIT_SERVICE_PORT || 3009;
app.use(express.json());

// In-memory audit log storage (MongoDB connection optional)
const auditLogs: any[] = [];
let mongoCollection: any = null;

// Try to connect to MongoDB
const initMongo = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && mongoUri !== 'mongodb://localhost:27017/video_loan_system') {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db('video_loan_system');
      mongoCollection = db.collection('audit_logs');
      console.log('✅ Connected to MongoDB for audit logs');
    } else {
      console.log('⚠️  MongoDB not configured, using in-memory audit storage');
    }
  } catch (error) {
    console.log('⚠️  MongoDB connection failed, using in-memory audit storage');
  }
};
initMongo();

// Store audit log
async function storeLog(log: any): Promise<void> {
  auditLogs.push(log);
  if (mongoCollection) {
    try {
      await mongoCollection.insertOne(log);
    } catch { /* fallback to in-memory */ }
  }
}

// ===========================
// ENDPOINTS
// ===========================

// Submit audit log
app.post('/log', async (req, res) => {
  const { sessionId, userId, action, details, source } = req.body;

  const auditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    sessionId: sessionId || 'system',
    userId: userId || 'system',
    action: action || 'UNKNOWN',
    details: details || {},
    source: source || 'unknown',
    timestamp: new Date().toISOString(),
    level: getLogLevel(action),
  };

  await storeLog(auditLog);
  console.log(`📝 [${auditLog.level}] ${action} - session: ${sessionId} from ${source}`);

  res.json({ id: auditLog.id, message: 'Audit log recorded' });
});

// Batch submit logs
app.post('/log/batch', async (req, res) => {
  const { logs } = req.body;
  if (!Array.isArray(logs)) return res.status(400).json({ error: 'logs must be an array' });

  const stored = [];
  for (const log of logs) {
    const auditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...log,
      timestamp: new Date().toISOString(),
      level: getLogLevel(log.action),
    };
    await storeLog(auditLog);
    stored.push(auditLog.id);
  }

  res.json({ message: `${stored.length} audit logs recorded`, ids: stored });
});

// Get logs by session
app.get('/logs/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;

  if (mongoCollection) {
    try {
      const logs = await mongoCollection.find({ sessionId }).sort({ timestamp: -1 }).toArray();
      return res.json(logs);
    } catch { /* fallback */ }
  }

  const logs = auditLogs.filter(l => l.sessionId === sessionId).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json(logs);
});

// Get all logs (with pagination)
app.get('/logs', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  if (mongoCollection) {
    try {
      const total = await mongoCollection.countDocuments();
      const logs = await mongoCollection.find().sort({ timestamp: -1 }).skip(offset).limit(limit).toArray();
      return res.json({ total, page, limit, logs });
    } catch { /* fallback */ }
  }

  const sorted = [...auditLogs].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const paginated = sorted.slice(offset, offset + limit);

  res.json({ total: auditLogs.length, page, limit, logs: paginated });
});

// Search logs
app.get('/search', (req, res) => {
  const { action, source, from, to } = req.query;

  let results = [...auditLogs];

  if (action) results = results.filter(l => l.action === action);
  if (source) results = results.filter(l => l.source === source);
  if (from) results = results.filter(l => new Date(l.timestamp) >= new Date(from as string));
  if (to) results = results.filter(l => new Date(l.timestamp) <= new Date(to as string));

  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ count: results.length, logs: results.slice(0, 100) });
});

// Consent audit trail
app.get('/consent/:sessionId', (req, res) => {
  const consents = auditLogs.filter(
    l => l.sessionId === req.params.sessionId && l.action.includes('CONSENT')
  );
  res.json({ sessionId: req.params.sessionId, consentTrail: consents });
});

// Decision audit trail
app.get('/decisions/:sessionId', (req, res) => {
  const decisions = auditLogs.filter(
    l => l.sessionId === req.params.sessionId &&
      (l.action.includes('RISK') || l.action.includes('OFFER') || l.action.includes('LLM'))
  );
  res.json({ sessionId: req.params.sessionId, decisionTrail: decisions });
});

// Log level classification
function getLogLevel(action: string): string {
  if (!action) return 'info';
  const upper = action.toUpperCase();
  if (upper.includes('ERROR') || upper.includes('FAIL')) return 'error';
  if (upper.includes('FRAUD') || upper.includes('REJECT')) return 'warning';
  if (upper.includes('CONSENT') || upper.includes('ACCEPT')) return 'critical';
  return 'info';
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'Audit Service is running',
    storage: mongoCollection ? 'mongodb' : 'in-memory',
    totalLogs: auditLogs.length,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Audit Service running on port ${PORT}`);
});

export default app;
