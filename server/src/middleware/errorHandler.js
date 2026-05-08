const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const correlationId = req.correlationId || 'no-correlation-id';

  if (err instanceof AppError) {
    logger.warn(`[${correlationId}] ${err.code}: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Recurso duplicado',
        details: err.errors?.map((e) => ({ field: e.path, message: e.message })),
      },
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        details: err.errors?.map((e) => ({ field: e.path, message: e.message })),
      },
    });
  }

  logger.error(`[${correlationId}] Error no controlado: ${err.message}`, { stack: err.stack });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    },
  });
};

module.exports = { errorHandler, notFoundHandler };
