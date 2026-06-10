const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS — allow local dev, netlify, any Vercel deployment, Render backend and explicit CLIENT_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://smart-wedger.netlify.app',
  'https://smart-wager.onrender.com',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / Postman (no origin header) or literal "null"
    if (!origin || origin === 'null') return callback(null, true)
    // Allow anything on *.vercel.app
    try {
      if (origin.endsWith('.vercel.app')) return callback(null, true)
    } catch (e) {
      // if origin is not a string for some reason, continue to rejection
    }
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true)
    console.warn(`CORS blocked origin: ${origin}`)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/equipment', require('./routes/equipment.routes'));
app.use('/api/issue', require('./routes/issue.routes'));
app.use('/api/return', require('./routes/return.routes'));
app.use('/api/submissions', require('./routes/submission.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/qr', require('./routes/qr.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
