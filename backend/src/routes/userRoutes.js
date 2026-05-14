const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const db = require('../config/db');
const env = require('../config/env');
const { authenticate, requireRole } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(1).max(12),
  role: z.enum(['ADMIN', 'TI', 'PERSONAL'])
});

const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(['ADMIN', 'TI', 'PERSONAL']).optional(),
  is_active: z.boolean().optional()
});

const passwordSchema = z.object({
  password: z.string().min(1).max(12)
});

router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.is_active, u.failed_login_attempts,
              u.last_login_at, r.name AS role, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = userSchema.parse(req.body);
    const username = data.username.toLowerCase();
    const email = `${username}@sati-timsa.local`;
    const passwordHash = await bcrypt.hash(data.password, env.bcryptRounds);
    const user = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (role_id, name, username, email, password_hash)
         SELECT r.id, $1, $2, $3, $4
         FROM roles r
         WHERE r.name = $5
         ON CONFLICT (username)
         DO UPDATE SET
           role_id = EXCLUDED.role_id,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           failed_login_attempts = 0,
           password_reset_code_hash = NULL,
           password_reset_expires_at = NULL,
           is_active = TRUE
         RETURNING id, name, username, email, is_active`,
        [data.name, username, email, passwordHash, data.role]
      );

      await writeAudit(client, req, 'UPSERT', 'users', rows[0].id, {
        username: rows[0].username,
        role: data.role
      });

      return { ...rows[0], role: data.role };
    });

    res.status(201).json({ user });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de usuario invalidos.' });
    }
    next(error);
  }
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = userUpdateSchema.parse(req.body);
    if (req.params.id === req.user.id && data.is_active === false) {
      return res.status(400).json({ message: 'No puede desactivar su propio usuario.' });
    }

    const user = await db.withTransaction(async (client) => {
      const previous = await client.query(
        `SELECT u.id, u.name, u.username, u.is_active, r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1
         FOR UPDATE`,
        [req.params.id]
      );
      if (!previous.rows[0]) {
        const error = new Error('Usuario no encontrado.');
        error.status = 404;
        throw error;
      }

      const roleName = data.role || previous.rows[0].role;
      const { rows } = await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             is_active = COALESCE($2, is_active),
             role_id = (SELECT id FROM roles WHERE name = $3)
         WHERE id = $4
         RETURNING id, name, username, email, is_active`,
        [
          data.name || null,
          typeof data.is_active === 'boolean' ? data.is_active : null,
          roleName,
          req.params.id
        ]
      );

      await writeAudit(client, req, 'UPDATE', 'users', req.params.id, {
        previous: previous.rows[0],
        current: { ...rows[0], role: roleName }
      });

      return { ...rows[0], role: roleName };
    });

    res.json({ user });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de usuario invalidos.' });
    }
    next(error);
  }
});

router.post('/:id/password', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const data = passwordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, env.bcryptRounds);
    await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE users
         SET password_hash = $1,
             failed_login_attempts = 0,
             password_reset_code_hash = NULL,
             password_reset_expires_at = NULL,
             is_active = TRUE
         WHERE id = $2
         RETURNING id, username`,
        [passwordHash, req.params.id]
      );
      if (!rows[0]) {
        const error = new Error('Usuario no encontrado.');
        error.status = 404;
        throw error;
      }
      await writeAudit(client, req, 'PASSWORD_RESET', 'users', req.params.id, {
        username: rows[0].username
      });
    });

    res.json({ message: 'Contrasena reiniciada correctamente.' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Contrasena invalida.' });
    }
    next(error);
  }
});

module.exports = router;
