const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const File = require('../models/File');
const {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile
} = require('../controllers/fileController');

const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Storage engine
// Multer setup with better error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  }
});

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'video/mp4',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint' // ppt
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// Wrapper to catch Multer errors
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Auth-protected file routes
// router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(uploadFile));
router.post('/upload', authMiddleware, uploadMiddleware, asyncHandler(uploadFile));

router.get('/', authMiddleware, asyncHandler(getFiles));
router.get('/download/:id', authMiddleware, asyncHandler(downloadFile));
router.delete('/:id', authMiddleware, asyncHandler(deleteFile));

// Public share access (safe DTO)
router.get('/shared/:id', asyncHandler(async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const safeFile = {
      id: file._id,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      createdAt: file.createdAt
    };
    res.json(safeFile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}));

// Public download for shared (streams file)
router.get('/shared/download/:id', asyncHandler(async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(__dirname, '../uploads', file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

    return res.download(filePath, file.originalname);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}));

// Generate secure share token
router.get('/generate-share-token/:id', authMiddleware, asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { fileId: req.params.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.json({ token });
}));

// Access shared file via secure token
router.get('/shared-secure/:token', asyncHandler(async (req, res) => {
  try {
    const { fileId } = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const safeFile = {
      id: file._id,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      createdAt: file.createdAt
    };
    res.json(safeFile);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}));

// Secure download via token
router.get('/shared-secure/download/:token', asyncHandler(async (req, res) => {
  try {
    const { fileId } = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(__dirname, '../uploads', file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

    res.download(filePath, file.originalname);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}));

module.exports = router;