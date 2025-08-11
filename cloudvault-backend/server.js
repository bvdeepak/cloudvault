const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// load env early
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const rateLimit = require('express-rate-limit');

// Limit repeated requests to auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many requests. Try again later.' }
});

const app = express();

// CORS - restrict in production
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', fileRoutes);

// Ensure uploads directory exists and serve it (careful: this is public)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Global error handler (captures asyncHandler and multer errors)
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

// DB & server start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})
.catch(err => console.error(err));