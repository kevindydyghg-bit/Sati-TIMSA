require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
const inferredCloudUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.WEBSITE_HOSTNAME
    ? `https://${process.env.WEBSITE_HOSTNAME}`
    : '';
const appUrl = process.env.APP_URL || inferredCloudUrl || 'http://localhost:3000';
const jwtSecret = process.env.JWT_SECRET;
const storageDriver = process.env.STORAGE_DRIVER || 'local';

if (!['local', 'supabase'].includes(storageDriver)) {
  throw new Error('STORAGE_DRIVER must be local or supabase.');
}

if (nodeEnv === 'production') {
  if (jwtSecret === 'change_this_to_a_very_long_random_secret' || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be a strong random value with at least 32 characters in production.');
  }

  if (appUrl.includes('localhost')) {
    throw new Error('APP_URL must be the public production URL, not localhost.');
  }

  if (storageDriver === 'supabase') {
    for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_BUCKET']) {
      if (!process.env[key]) {
        throw new Error(`Missing required Supabase Storage variable in production: ${key}`);
      }
    }
  }
}

module.exports = {
  nodeEnv,
  port: Number(process.env.PORT || 3000),
  appUrl,
  databaseUrl: process.env.DATABASE_URL,
  pgSslMode: process.env.PGSSLMODE || 'disable',
  pgPoolMax: Number(process.env.PG_POOL_MAX || 12),
  pgIdleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  pgConnectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 8000),
  pgStatementTimeoutMillis: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 15000),
  pgQueryTimeoutMillis: Number(process.env.PG_QUERY_TIMEOUT_MS || 20000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  storageDriver,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseBucket: process.env.SUPABASE_BUCKET || 'equipment-images'
};
