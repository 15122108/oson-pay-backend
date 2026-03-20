require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 8080; // <-- TO‘G‘RI

// ─── Security middleware ─────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ───────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Ko'p so'rov yuborildi. Keyinroq urinib ko'ring." },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: "OTP limitiga yetdingiz. 1 daqiqadan keyin urinib ko'ring." },
});

app.use('/api/', limiter);
app.use('/api/auth/send-otp', otpLimiter);

// ─── Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ──────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// ─── Error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server xatoligi' });
});

// Run migrations on startup
const runMigrations = require('./migrations/run');
runMigrations().catch(console.error);

// ─── Start ───────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => { // <-- MUHIM: 0.0.0.0
  console.log(`\n🚀 PayFlow Backend running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
