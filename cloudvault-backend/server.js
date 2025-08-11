const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // 👈 Add this line

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const rateLimit = require('express-rate-limit');

// Limit repeated requests to auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many requests. Try again later.' }
});



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authLimiter);


// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
// app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api', fileRoutes); // optional fallback route

// DB & server start
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
})
.catch(err => console.error(err));
