const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { UnauthorizedError } = require('../utils/AppError');

const authenticate = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso requerido'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      storeId: payload.storeId,
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expirado'));
    }
    return next(new UnauthorizedError('Token invalido'));
  }
};

module.exports = authenticate;
