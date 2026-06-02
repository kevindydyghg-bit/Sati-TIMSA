function notFound(req, res) {
  res.status(404).json({ message: 'Recurso no encontrado.' });
}

const safeMessages = {
  400: 'Solicitud invalida.',
  401: 'No autorizado.',
  403: 'Permiso denegado.',
  404: 'Recurso no encontrado.',
  409: 'Conflicto al procesar la solicitud.',
  410: 'Recurso no disponible.',
  422: 'Datos invalidos.',
  429: 'Demasiadas solicitudes.',
  500: 'Error interno del servidor.',
  502: 'Error de comunicacion con servicio externo.',
  503: 'Servicio temporalmente no disponible.'
};

function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const message = safeMessages[status] || (status >= 500 ? 'Error interno del servidor.' : 'Error de solicitud.');

  if (status >= 500) {
    console.error('[ERROR]', error);
  }

  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
