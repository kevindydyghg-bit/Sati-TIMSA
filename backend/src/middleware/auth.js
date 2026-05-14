const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Token requerido.' });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.is_active, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [payload.sub]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Usuario no autorizado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sesion invalida o expirada.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permisos insuficientes.' });
    }
    next();
  };
}

function requireWriteAccess(req, res, next) {
  return requireRole('ADMIN', 'TI')(req, res, next);
}

module.exports = { authenticate, requireRole, requireWriteAccess };
