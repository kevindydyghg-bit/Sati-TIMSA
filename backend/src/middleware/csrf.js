const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function csrfProtection(req, res, next) {
  if (!mutatingMethods.has(req.method)) {
    return next();
  }

  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).json({ message: 'CSRF validation failed.' });
  }

  if (req.body && typeof req.body === 'object') {
    try {
      JSON.stringify(req.body);
    } catch {
      return res.status(400).json({ message: 'JSON invalido.' });
    }
  }

  next();
}

module.exports = { csrfProtection };
