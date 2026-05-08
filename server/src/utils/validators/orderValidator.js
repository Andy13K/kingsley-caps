const Joi = require('joi');

const shippingAddressSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  address: Joi.string().min(5).max(500).required(),
  city: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(7).max(20).required(),
  notes: Joi.string().max(500).allow('', null),
});

const createOrderSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
  shippingAddress: shippingAddressSchema.required(),
  paymentMethod: Joi.string().valid('crypto_eth', 'card', 'transfer').required(),
  shippingMethod: Joi.string().max(100),
  shippingAmount: Joi.number().precision(2).min(0).default(0),
  customerNotes: Joi.string().max(1000).allow('', null),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'pending_payment',
      'paid',
      'preparing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    )
    .required(),
  vendorNotes: Joi.string().max(1000).allow('', null),
});

const trackingSchema = Joi.object({
  trackingNumber: Joi.string().min(3).max(100).required(),
  trackingCompany: Joi.string().min(2).max(100).required(),
});

const listOrdersSchema = Joi.object({
  status: Joi.string(),
  storeId: Joi.string().uuid(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

module.exports = {
  createOrderSchema,
  updateStatusSchema,
  trackingSchema,
  listOrdersSchema,
};
