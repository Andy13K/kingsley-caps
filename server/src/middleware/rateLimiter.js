const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? req.body.email.toLowerCase() : 'unknown';
    return `${req.ip}:${email}`;
  },
  handler: (req, res, next) => {
    next(new AppError('Demasiados intentos. Intenta de nuevo en 15 minutos.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res, next) => {
    next(new AppError('Demasiadas solicitudes. Intenta de nuevo en un momento.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
