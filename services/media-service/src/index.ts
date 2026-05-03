import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.MEDIA_SERVICE_PORT || 3002;

// Configure AWS S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Job queue
const mediaQueue = new Queue('media-uploads', process.env.REDIS_URL);

// Upload video endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const { sessionId } = req.body;
  const key = `videos/${sessionId}/${Date.now()}-${req.file.originalname}`;

  try {
    // Queue the upload job
    await mediaQueue.add(
      { fileBuffer: req.file.buffer, key, sessionId },
      { attempts: 3, backoff: 'exponential' }
    );

    res.json({ message: 'Video upload queued', key });
  } catch (error) {
    console.error('Error queuing upload:', error);
    res.status(500).json({ error: 'Failed to queue upload' });
  }
});

// Process uploaded videos
mediaQueue.process(async (job) => {
  const { fileBuffer, key } = job.data;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: fileBuffer,
    ContentType: 'video/mp4',
  };

  await s3.upload(params).promise();
  console.log(`Video uploaded to S3: ${key}`);
  return { url: `s3://${process.env.AWS_S3_BUCKET}/${key}` };
});

app.get('/health', (req, res) => {
  res.json({ status: 'Media Service is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Media Service running on port ${PORT}`);
});

export default app;
