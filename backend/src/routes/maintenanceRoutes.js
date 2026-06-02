
const express = require('express');
const router = express.Router();


router.all('*', (req, res) => {
  res.status(410).json({ message: 'Modulo de mantenimiento deshabilitado.' });
});

module.exports = router;
