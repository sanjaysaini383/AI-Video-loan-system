import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.MEDIA_SERVICE_PORT || 3002;
app.use(express.json());

// Local storage directory
const STORAGE_DIR = process.env.MEDIA_STORAGE_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const sessionDir = path.join(STORAGE_DIR, _req.body?.sessionId || 'unknown');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    cb(null, sessionDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${timestamp}-${file.fieldname}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/webm', 'video/mp4', 'audio/webm', 'audio/mp4', 'audio/wav', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

// Upload video/audio chunk
app.post('/upload', upload.single('media'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const sessionId = req.body.sessionId || 'unknown';
  const fileInfo = {
    sessionId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: req.file.path,
    url: `/files/${sessionId}/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
  };

  console.log(`📹 File uploaded: ${fileInfo.filename} (${(fileInfo.size / 1024).toFixed(1)} KB)`);
  res.json({ message: 'File uploaded successfully', file: fileInfo });
});

// Upload video frame (base64)
app.post('/upload-frame', async (req, res) => {
  const { sessionId, frameData, timestamp } = req.body;
  if (!frameData) return res.status(400).json({ error: 'No frame data provided' });

  const sessionDir = path.join(STORAGE_DIR, sessionId || 'unknown');
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const filename = `frame-${timestamp || Date.now()}.jpg`;
  const filePath = path.join(sessionDir, filename);

  // Remove base64 header
  const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  res.json({ message: 'Frame saved', filename, path: `/files/${sessionId}/${filename}` });
});

// List files for a session
app.get('/files/:sessionId', (req, res) => {
  const sessionDir = path.join(STORAGE_DIR, req.params.sessionId);
  if (!fs.existsSync(sessionDir)) return res.json({ files: [] });

  const files = fs.readdirSync(sessionDir).map(f => {
    const stats = fs.statSync(path.join(sessionDir, f));
    return {
      filename: f,
      size: stats.size,
      url: `/files/${req.params.sessionId}/${f}`,
      createdAt: stats.birthtime,
    };
  });

  res.json({ sessionId: req.params.sessionId, files });
});

// Serve files
app.use('/files', express.static(STORAGE_DIR));

// Health check
app.get('/health', (_req, res) => {
  const totalSize = fs.existsSync(STORAGE_DIR) ?
    fs.readdirSync(STORAGE_DIR).length : 0;
  res.json({ status: 'Media Service is running', storageDir: STORAGE_DIR, sessionCount: totalSize });
});

app.listen(PORT, () => {
  console.log(`🚀 Media Service running on port ${PORT}`);
  console.log(`📁 Storage directory: ${STORAGE_DIR}`);
});

export default app;
