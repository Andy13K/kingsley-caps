const Joi = require('joi');
const AppError = require('../utils/AppError');

const trackingSchema = Joi.object({
  trackingNumber: Joi.string().min(5).max(100).required(),
  trackingCompany: Joi.string().min(2).max(100).required(),
});

const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'query' ? req.query : req.body;
  const { error, value } = schema.validate(data, { abortEarly: false, convert: true });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }
  if (source === 'query') { req.query = value; } else { req.body = value; }
  next();
};

module.exports = { trackingSchema, validate };
