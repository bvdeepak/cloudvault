// cloudvault-backend/controllers/fileController.js

const File = require('../models/File');
const path = require('path');
const fs = require('fs');

// Upload File
exports.uploadFile = async (req, res) => {
  const file = await File.create({
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    user: req.user.id,
  });
  res.status(201).json(file);
};

// Get All Files for Authenticated User
exports.getFiles = async (req, res) => {
  const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(files);
};

// Download File
exports.downloadFile = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, user: req.user.id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const filePath = path.join(__dirname, '../uploads', file.filename);
  res.download(filePath, file.originalname);
};

// Delete File
exports.deleteFile = async (req, res) => {
  const file = await File.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!file) return res.status(404).json({ message: 'File not found' });

  const filePath = path.join(__dirname, '../uploads', file.filename);

  // ✅ Check if file exists before deleting
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.status(200).json({ message: 'File deleted successfully' });
};
