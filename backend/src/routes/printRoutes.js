const { Router } = require('express');
const net = require('net');
const { z } = require('zod');
const { authenticate, requireWriteAccess } = require('../middleware/auth');

const router = Router();

const printSchema = z.object({
  zpl: z.string().min(10, 'El ZPL debe tener al menos 10 caracteres.'),
  printerIP: z.string().ip({ version: 'ipv4', message: 'Direccion IP invalida.' })
});

router.post('/', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const { zpl, printerIP } = printSchema.parse(req.body);
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Tiempo de espera agotado al conectar con la impresora.'));
      }, 8000);
      socket.connect(9100, printerIP, () => {
        socket.write(zpl, 'utf8', (err) => {
          if (err) {
            clearTimeout(timeout);
            socket.destroy();
            return reject(new Error('Error al enviar datos a la impresora.'));
          }
          socket.end();
          clearTimeout(timeout);
          resolve();
        });
      });
      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`No se pudo conectar con la impresora en ${printerIP}. Verifique la IP.`));
      });
    });
    res.json({ message: 'Etiqueta enviada a la impresora correctamente.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

module.exports = router;
