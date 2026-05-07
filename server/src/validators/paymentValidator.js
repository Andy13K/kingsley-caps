const Joi = require('joi');
const AppError = require('../utils/AppError');

const initiateSchema = Joi.object({ orderId: Joi.string().uuid().required() });
const verifySchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
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

module.exports = { initiateSchema, verifySchema, validate };
