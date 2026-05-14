const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../config/db');
const env = require('../config/env');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetCode } = require('../services/mailService');

const router = express.Router();

const loginSchema = z.object({
  username: z.string().trim().min(1).max(40),
  password: z.string().min(1).max(12)
});

const resetRequestSchema = z.object({
  username: z.string().trim().min(1).max(40)
});

const resetConfirmSchema = z.object({
  username: z.string().trim().min(1).max(40),
  code: z.string().trim().length(6),
  password: z.string().min(1).max(12)
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(12),
  new_password: z.string().min(1).max(12)
});

router.post('/login', async (req, res, next) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.password_hash, u.is_active, u.failed_login_attempts, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE lower(u.username) = lower($1)`,
      [credentials.username]
    );

    const user = rows[0];
    const validPassword = user ? await bcrypt.compare(credentials.password, user.password_hash) : false;

    if (!user || !validPassword || !user.is_active) {
      if (user) {
        const attempts = Math.min(Number(user.failed_login_attempts || 0) + 1, 3);
        await db.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id]);
        return res.status(401).json({
          message: attempts >= 3
            ? 'Contrasena incorrecta. Puede reintentar o cambiar la contrasena con codigo de verificacion.'
            : 'Credenciales invalidas.',
          failedAttempts: attempts,
          resetAvailable: attempts >= 3
        });
      }
      return res.status(401).json({ message: 'Credenciales invalidas.', failedAttempts: 0 });
    }

    await db.query(
      `UPDATE users
       SET failed_login_attempts = 0,
           password_reset_code_hash = NULL,
           password_reset_expires_at = NULL,
           last_login_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de acceso invalidos.' });
    }
    next(error);
  }
});

router.post('/password-reset/request', async (req, res, next) => {
  try {
    const data = resetRequestSchema.parse(req.body);
    const { rows } = await db.query(
      'SELECT id, username, email FROM users WHERE lower(username) = lower($1) AND is_active = TRUE',
      [data.username]
    );

    const user = rows[0];
    if (!user) {
      return res.json({ message: 'Si el usuario existe, se enviara un codigo de verificacion.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, env.bcryptRounds);
    await db.query(
      `UPDATE users
       SET password_reset_code_hash = $1, password_reset_expires_at = NOW() + INTERVAL '10 minutes'
       WHERE id = $2`,
      [codeHash, user.id]
    );

    const result = await sendPasswordResetCode(user.email, code);
    res.json({
      message: result.sent
        ? 'Codigo enviado al correo registrado.'
        : 'Codigo generado. Configure SMTP/Gmail para envio real.',
      devCode: env.nodeEnv === 'production' ? undefined : result.code
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Usuario invalido.' });
    }
    next(error);
  }
});

router.post('/password-reset/confirm', async (req, res, next) => {
  try {
    const data = resetConfirmSchema.parse(req.body);
    const { rows } = await db.query(
      `SELECT id, password_reset_code_hash, password_reset_expires_at
       FROM users
       WHERE lower(username) = lower($1) AND is_active = TRUE`,
      [data.username]
    );

    const user = rows[0];
    const validCode = user?.password_reset_code_hash
      ? await bcrypt.compare(data.code, user.password_reset_code_hash)
      : false;
    const notExpired = user?.password_reset_expires_at && new Date(user.password_reset_expires_at) > new Date();

    if (!user || !validCode || !notExpired) {
      return res.status(400).json({ message: 'Codigo invalido o expirado.' });
    }

    const passwordHash = await bcrypt.hash(data.password, env.bcryptRounds);
    await db.query(
      `UPDATE users
       SET password_hash = $1,
           failed_login_attempts = 0,
           password_reset_code_hash = NULL,
           password_reset_expires_at = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.json({ message: 'Contrasena actualizada. Inicie sesion nuevamente.' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de recuperacion invalidos.' });
    }
    next(error);
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/password', authenticate, async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    if (data.current_password === data.new_password) {
      return res.status(400).json({ message: 'La nueva contrasena debe ser diferente.' });
    }

    const { rows } = await db.query(
      'SELECT id, password_hash FROM users WHERE id = $1 AND is_active = TRUE',
      [req.user.id]
    );
    const user = rows[0];
    const validPassword = user ? await bcrypt.compare(data.current_password, user.password_hash) : false;
    if (!validPassword) {
      return res.status(400).json({ message: 'Contrasena actual incorrecta.' });
    }

    const passwordHash = await bcrypt.hash(data.new_password, env.bcryptRounds);
    await db.query(
      `UPDATE users
       SET password_hash = $1,
           failed_login_attempts = 0,
           password_reset_code_hash = NULL,
           password_reset_expires_at = NULL
       WHERE id = $2`,
      [passwordHash, req.user.id]
    );

    res.json({ message: 'Contrasena actualizada correctamente.' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de contrasena invalidos.' });
    }
    next(error);
  }
});

module.exports = router;
