const Joi = require('joi');
const AppError = require('../utils/AppError');

const adjustStockSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
  type: Joi.string().valid('in', 'out').required(),
  reason: Joi.string().max(100).required(),
});

const movementFiltersSchema = Joi.object({
  variantId: Joi.string().uuid().optional(),
  type: Joi.string().valid('in', 'out', 'adjustment', 'reserved', 'released').optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'query' ? req.query : req.body;
  const { error, value } = schema.validate(data, { abortEarly: false, convert: true });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }
  if (source === 'query') {
    req.query = value;
  } else {
    req.body = value;
  }
  next();
};

module.exports = { adjustStockSchema, movementFiltersSchema, validate };
