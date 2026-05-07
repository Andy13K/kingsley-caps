const AppError = require('../utils/AppError');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('No autenticado', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('No tienes permisos para esta acción', 403));
  }
  next();
};

module.exports = authorize;
