const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const env = require('./config/env');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const auditRoutes = require('./routes/auditRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const stockRoutes = require('./routes/stockRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const publicDir = path.join(__dirname, '..', '..', 'frontend');
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const supabaseImageOrigin = env.supabaseUrl ? new URL(env.supabaseUrl).origin : '';
const imageSources = ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'];

if (supabaseImageOrigin) {
  imageSources.push(supabaseImageOrigin);
}

app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'"],
        imgSrc: imageSources,
        connectSrc: ["'self'"]
      }
    }
  })
);
app.use(cors({ origin: env.appUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesion. Intente mas tarde.' }
}));

app.get('/api/health', async (req, res, next) => {
  try {
    const started = process.hrtime.bigint();
    await db.query('SELECT 1');
    const latencyMs = Number(process.hrtime.bigint() - started) / 1000000;
    res.json({
      status: 'ok',
      database: 'connected',
      db_latency_ms: Math.round(latencyMs),
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/equipment', inventoryRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', notFound);

app.use('/uploads', express.static(uploadsDir, {
  fallthrough: false,
  maxAge: env.nodeEnv === 'production' ? '1d' : 0
}));
app.use(express.static(publicDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'pages', 'index.html'));
});

app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(env.port, () => {
    console.log(`SATI-TIMSA running on port ${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} recibido. Cerrando SATI-TIMSA...`);
    server.close(async () => {
      try {
        await db.close();
        process.exit(0);
      } catch (error) {
        console.error('Error cerrando PostgreSQL:', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
