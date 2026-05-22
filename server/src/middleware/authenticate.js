const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  const header = req.header?.('Authorization') || req.headers?.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso requerido'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret);
    const user = await User.findByPk(payload.sub);
    if (!user || user.status === 'suspended') {
      return next(new UnauthorizedError('Usuario inactivo'));
    }
    if (payload.storeId && user.storeId === undefined) {
      user.storeId = payload.storeId;
    }
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expirado'));
    }
    return next(new UnauthorizedError('Token invalido'));
  }
};

module.exports = authenticate;
