const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cron = require('node-cron');
const env = require('./config/env');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const lifecycleRoutes = require('./routes/lifecycleRoutes');
const printRoutes = require('./routes/printRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const stockRoutes = require('./routes/stockRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const searchRoutes = require('./routes/searchRoutes');
const auditRoutes = require('./routes/auditRoutes');
const notesRoutes = require('./routes/notesRoutes');
const { runDepreciation } = require('./jobs/depreciationScheduler');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { csrfProtection, csrfTokenEndpoint } = require('./middleware/csrf');

const app = express();
const publicDir = path.join(__dirname, '..', '..', 'frontend');
const supabaseImageOrigin = env.supabaseUrl ? new URL(env.supabaseUrl).origin : '';
const imageSources = ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'];

if (supabaseImageOrigin) {
  imageSources.push(supabaseImageOrigin);
}

app.set('trust proxy', 1);

if (env.isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http' || req.protocol === 'http') {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://unpkg.com', 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: imageSources,
        connectSrc: ["'self'", 'http://localhost:3001', 'https://cdn.jsdelivr.net', 'https://unpkg.com', 'https://cdnjs.cloudflare.com', ...env.appUrls],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'blob:'],
        frameSrc: ["'none'"]
      }
    },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xXssProtection: false,
    xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    permissionsPolicy: {
      features: {
        camera: ["'self'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        notifications: ["'none'"],
        payment: ["'none'"],
        usb: ["'none'"]
      }
    }
  })
);
app.use(cors({ origin: env.appUrls, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

const morganFormat = env.isProduction
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
  : 'dev';
const sensitiveHeaders = /authorization|cookie|set-cookie|x-xsrf-token|x-csrf-token/i;
morgan.token('req-headers', (req) => {
  const filtered = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    filtered[key] = sensitiveHeaders.test(key) ? '[FILTERED]' : value;
  }
  return JSON.stringify(filtered);
});
app.use(morgan(morganFormat));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  next();
});
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesion. Intente mas tarde.' }
}));

const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas operaciones de escritura. Intente mas tarde.' }
});

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
    console.error('Healthcheck database error:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/csrf-token', csrfTokenEndpoint);
app.use('/api', csrfProtection);

app.use('/api/auth', writeRateLimit, authRoutes);
app.use('/api/users', writeRateLimit, userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/equipment', writeRateLimit, inventoryRoutes);
app.use('/api/equipment', lifecycleRoutes);
app.use('/api/maintenance', writeRateLimit, maintenanceRoutes);
app.use('/api/stock', writeRateLimit, stockRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/print', printRoutes);
app.use('/api/notes', writeRateLimit, notesRoutes);
app.use('/api/search', searchRoutes);

app.use('/api', notFound);

app.use(express.static(publicDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'pages', 'index.html'));
});

app.use(errorHandler);

(async () => {
  try {
    await db.runMigrations();
  } catch (error) {
    console.error('Migration error:', error.message);
  }
})();

if (require.main === module) {
  const server = app.listen(env.port, () => {
    console.log(`SATI-TIMSA running on port ${env.port}`);
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      await runDepreciation();
    } catch (error) {
      console.error('[DepreciationScheduler] Error:', error.message);
    }
  }, { timezone: 'America/Mexico_City' });

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

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exitCode = 1;
});

module.exports = app;
