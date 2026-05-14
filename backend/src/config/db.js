const { Pool } = require('pg');
const env = require('./env');

const ssl = env.pgSslMode === 'require' ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
  max: env.pgPoolMax,
  idleTimeoutMillis: env.pgIdleTimeoutMillis,
  connectionTimeoutMillis: env.pgConnectionTimeoutMillis,
  statement_timeout: env.pgStatementTimeoutMillis,
  query_timeout: env.pgQueryTimeoutMillis,
  keepAlive: true,
  application_name: 'sati-timsa-api'
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch((rollbackError) => {
      console.error('PostgreSQL rollback error:', rollbackError.message);
    });
    throw error;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, withTransaction, close };
