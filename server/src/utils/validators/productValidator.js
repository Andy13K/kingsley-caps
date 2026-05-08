const Joi = require('joi');

const variantSchema = Joi.object({
  size: Joi.string().max(10).allow(null, ''),
  color: Joi.string().max(50).allow(null, ''),
  sku: Joi.string().max(100).required(),
  stock: Joi.number().integer().min(0).default(0),
  priceOverride: Joi.number().precision(2).min(0).allow(null),
  lowStockThreshold: Joi.number().integer().min(0).default(3),
  active: Joi.boolean().default(true),
});

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(5000).allow('', null),
  basePrice: Joi.number().precision(2).min(0).required(),
  category: Joi.string().max(100).allow('', null),
  images: Joi.array().items(Joi.string().uri()).default([]),
  tags: Joi.array().items(Joi.string()).default([]),
  featured: Joi.boolean().default(false),
  status: Joi.string().valid('draft', 'active', 'archived').default('draft'),
  variants: Joi.array().items(variantSchema).default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  description: Joi.string().max(5000).allow('', null),
  basePrice: Joi.number().precision(2).min(0),
  category: Joi.string().max(100).allow('', null),
  images: Joi.array().items(Joi.string().uri()),
  tags: Joi.array().items(Joi.string()),
  featured: Joi.boolean(),
  status: Joi.string().valid('draft', 'active', 'archived'),
}).min(1);

const listProductsSchema = Joi.object({
  storeId: Joi.string().uuid(),
  category: Joi.string(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  available: Joi.boolean(),
  search: Joi.string().min(1).max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
};
