import express from 'express';
import { MongoClient, Db, Collection } from 'mongodb';
import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.AUDIT_SERVICE_PORT || 3009;

let db: Db;
let auditCollection: Collection;

// MongoDB connection
const connectMongo = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  db = client.db('video_loan_system');
  auditCollection = db.collection('audit_logs');
  console.log('Connected to MongoDB');
};

connectMongo().catch(console.error);

// Job queue for audit logging
const auditQueue = new Queue('audit-jobs', process.env.REDIS_URL);

// Submit audit log
app.post('/log', express.json(), async (req, res) => {
  const { sessionId, userId, action, details, source } = req.body;

  try {
    const job = await auditQueue.add(
      { sessionId, userId, action, details, source },
      { priority: 2 }
    );

    res.json({ jobId: job.id, message: 'Audit log queued' });
  } catch (error) {
    console.error('Error queuing audit job:', error);
    res.status(500).json({ error: 'Failed to queue audit log' });
  }
});

// Get audit logs for session
app.get('/logs/:sessionId', async (req, res) => {
  try {
    const logs = await auditCollection
      .find({ sessionId: req.params.sessionId })
      .toArray();

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Process audit jobs
auditQueue.process(async (job) => {
  const { sessionId, userId, action, details, source } = job.data;

  console.log(`Logging audit: ${action} for session ${sessionId}`);

  const auditLog = {
    sessionId,
    userId,
    action,
    details,
    source,
    timestamp: new Date(),
  };

  await auditCollection.insertOne(auditLog);
  return auditLog;
});

app.get('/health', (req, res) => {
  res.json({ status: 'Audit Service is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Audit Service running on port ${PORT}`);
});

export default app;
