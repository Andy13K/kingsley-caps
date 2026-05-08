const Joi = require('joi');

const getCartSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
});

const addItemSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
  productVariantId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const clearCartSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
});

module.exports = {
  getCartSchema,
  addItemSchema,
  updateItemSchema,
  clearCartSchema,
};
