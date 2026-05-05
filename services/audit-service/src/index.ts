import express from 'express';
import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.AUDIT_SERVICE_PORT || 3009;
app.use(express.json());

// ===========================
// MONGODB CONNECTION
// ===========================
let db: Db;
let auditCollection: Collection;
let mongoConnected = false;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video_loan_system';

const initMongo = async () => {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('video_loan_system');
    auditCollection = db.collection('audit_logs');

    // Create indexes for efficient querying
    await auditCollection.createIndex({ sessionId: 1, timestamp: -1 });
    await auditCollection.createIndex({ userId: 1 });
    await auditCollection.createIndex({ action: 1 });
    await auditCollection.createIndex({ timestamp: -1 });
    await auditCollection.createIndex({ 'level': 1 });

    mongoConnected = true;
    console.log(`✅ MongoDB connected: ${MONGODB_URI}`);

    const count = await auditCollection.countDocuments();
    console.log(`📊 Existing audit logs: ${count}`);
  } catch (error: any) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error('Audit service requires MongoDB. Start with: docker run -d -p 27017:27017 mongo:7');
  }
};
initMongo();

function getLogLevel(action: string): string {
  if (!action) return 'info';
  const upper = action.toUpperCase();
  if (upper.includes('ERROR') || upper.includes('FAIL')) return 'error';
  if (upper.includes('FRAUD') || upper.includes('REJECT')) return 'warning';
  if (upper.includes('CONSENT') || upper.includes('ACCEPT')) return 'critical';
  if (upper.includes('STARTED') || upper.includes('CREATED')) return 'info';
  return 'info';
}

// ===========================
// ENDPOINTS
// ===========================

// Submit audit log
app.post('/log', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  const { sessionId, userId, action, details, source, timestamp } = req.body;

  const auditLog = {
    sessionId: sessionId || 'system',
    userId: userId || 'system',
    action: action || 'UNKNOWN',
    details: details || {},
    source: source || 'unknown',
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    level: getLogLevel(action),
    createdAt: new Date(),
  };

  try {
    const result = await auditCollection.insertOne(auditLog);
    console.log(`📝 [${auditLog.level.toUpperCase()}] ${action} | session:${sessionId} | source:${source}`);
    res.json({ id: result.insertedId.toString(), message: 'Audit log recorded' });
  } catch (e: any) {
    console.error('MongoDB insert error:', e.message);
    res.status(500).json({ error: 'Failed to store audit log' });
  }
});

// Batch submit
app.post('/log/batch', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  const { logs } = req.body;
  if (!Array.isArray(logs)) return res.status(400).json({ error: 'logs must be an array' });

  const formatted = logs.map(l => ({
    ...l,
    timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
    level: getLogLevel(l.action),
    createdAt: new Date(),
  }));

  try {
    const result = await auditCollection.insertMany(formatted);
    res.json({ message: `${result.insertedCount} logs recorded` });
  } catch (e: any) {
    res.status(500).json({ error: 'Batch insert failed' });
  }
});

// Get logs by session
app.get('/logs/:sessionId', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  try {
    const logs = await auditCollection
      .find({ sessionId: req.params.sessionId })
      .sort({ timestamp: -1 })
      .toArray();
    res.json({ sessionId: req.params.sessionId, count: logs.length, logs });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get all logs (paginated)
app.get('/logs', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = (page - 1) * limit;

  try {
    const total = await auditCollection.countDocuments();
    const logs = await auditCollection
      .find()
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    res.json({ total, page, limit, logs });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Search logs
app.get('/search', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  const { action, source, userId, level, from, to } = req.query;
  const filter: any = {};

  if (action) filter.action = action;
  if (source) filter.source = source;
  if (userId) filter.userId = userId;
  if (level) filter.level = level;
  if (from || to) {
    filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from as string);
    if (to) filter.timestamp.$lte = new Date(to as string);
  }

  try {
    const logs = await auditCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    res.json({ count: logs.length, filter, logs });
  } catch (e: any) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Consent audit trail
app.get('/consent/:sessionId', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  try {
    const logs = await auditCollection
      .find({ sessionId: req.params.sessionId, action: { $regex: /CONSENT/i } })
      .sort({ timestamp: 1 })
      .toArray();
    res.json({ sessionId: req.params.sessionId, consentTrail: logs });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch consent trail' });
  }
});

// Decision audit trail
app.get('/decisions/:sessionId', async (req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  try {
    const logs = await auditCollection
      .find({
        sessionId: req.params.sessionId,
        action: { $in: ['RISK_ASSESSED', 'LLM_ANALYSIS_COMPLETED', 'OFFERS_GENERATED', 'OFFER_ACCEPTED', 'PIPELINE_COMPLETED'] },
      })
      .sort({ timestamp: 1 })
      .toArray();
    res.json({ sessionId: req.params.sessionId, decisionTrail: logs });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch decision trail' });
  }
});

// Stats
app.get('/stats', async (_req, res) => {
  if (!mongoConnected) return res.status(503).json({ error: 'MongoDB not connected' });

  try {
    const total = await auditCollection.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await auditCollection.countDocuments({ timestamp: { $gte: today } });

    const actionCounts = await auditCollection.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).toArray();

    res.json({ total, today: todayCount, byAction: actionCounts });
  } catch (e: any) {
    res.status(500).json({ error: 'Stats query failed' });
  }
});

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'Audit Service running',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    uri: MONGODB_URI.replace(/\/\/.*@/, '//***@'), // hide credentials
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Audit Service running on port ${PORT}`);
});

export default app;
