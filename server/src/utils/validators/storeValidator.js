const Joi = require('joi');

const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

const createStoreSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).allow('', null),
  logoUrl: Joi.string().uri().max(500).allow('', null),
  logo_url: Joi.string().uri().max(500).allow('', null),
});

const updateStoreSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().max(2000).allow('', null),
  logoUrl: Joi.string().uri().max(500).allow('', null),
  logo_url: Joi.string().uri().max(500).allow('', null),
  shippingMethods: Joi.alternatives().try(Joi.object(), Joi.array()),
  shipping_methods: Joi.alternatives().try(Joi.object(), Joi.array()),
  cryptoEnabled: Joi.boolean(),
  crypto_enabled: Joi.boolean(),
  ethWalletAddress: Joi.string().pattern(ETH_ADDRESS).allow('', null),
  eth_wallet_address: Joi.string().pattern(ETH_ADDRESS).allow('', null),
  ethConfirmationsRequired: Joi.number().integer().min(1).max(20),
  eth_confirmations_required: Joi.number().integer().min(1).max(20),
}).min(1);

const cryptoConfigSchema = Joi.object({
  ethWalletAddress: Joi.string().pattern(ETH_ADDRESS).required().messages({
    'string.pattern.base': 'Direccion ETH invalida (esperado 0x + 40 hex)',
  }),
  ethConfirmationsRequired: Joi.number().integer().min(1).max(20).default(3),
  cryptoEnabled: Joi.boolean().default(true),
});

module.exports = {
  createStoreSchema,
  updateStoreSchema,
  cryptoConfigSchema,
};
