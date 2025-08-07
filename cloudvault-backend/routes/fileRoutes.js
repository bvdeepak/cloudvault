// cloudvault-backend/routes/fileRoutes.js

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
const asyncHandler = require('../utils/asyncHandler'); // ✅ Cleaner error handling

const router = express.Router();

// ✅ Storage engine with filename sanitization
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  }
});

// ✅ File type filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ storage, fileFilter });

// ✅ Routes
router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(uploadFile));
router.get('/', authMiddleware, asyncHandler(getFiles));
router.get('/download/:id', authMiddleware, asyncHandler(downloadFile));
router.delete('/:id', authMiddleware, asyncHandler(deleteFile));

// ✅ Public share access (basic)
// GET /api/files/shared/:id
router.get('/shared/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Generate secure share token
router.get('/generate-share-token/:id', authMiddleware, asyncHandler(async (req, res) => {
  const token = jwt.sign(
    { fileId: req.params.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  res.json({ token });
}));

// ✅ Access shared file via secure token
router.get('/shared-secure/:token', asyncHandler(async (req, res) => {
  try {
    const { fileId } = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}));

module.exports = router;
