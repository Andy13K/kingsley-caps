const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('Store', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vendor_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  logo_url: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('draft', 'active', 'suspended', 'closed'), allowNull: false, defaultValue: 'draft' },
  plan: { type: DataTypes.ENUM('basic', 'pro', 'enterprise'), allowNull: false, defaultValue: 'basic' },
  crypto_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  eth_wallet_address: { type: DataTypes.STRING(42), allowNull: true },
  eth_confirmations_required: { type: DataTypes.INTEGER, defaultValue: 3 },
  shipping_methods: { type: DataTypes.JSONB, allowNull: true },
}, { tableName: 'store', underscored: true });

module.exports = Store;
