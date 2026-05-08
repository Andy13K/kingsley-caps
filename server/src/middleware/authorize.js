const { ForbiddenError, UnauthorizedError } = require('../utils/AppError');

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError(`Rol "${req.user.role}" no autorizado para esta accion`));
  }
  return next();
};

module.exports = authorize;
