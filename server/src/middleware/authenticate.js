const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token de autenticación requerido', 401);
  }

  const token = authHeader.split(' ')[1];
  let payload;

  try {
    payload = jwt.verify(token, jwtConfig.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expirado', 401);
    }
    throw new AppError('Token inválido', 401);
  }

  const user = await User.findByPk(payload.sub);
  if (!user || user.status !== 'active') {
    throw new AppError('Usuario no encontrado o inactivo', 401);
  }

  req.user = user;
  next();
});

module.exports = authenticate;
