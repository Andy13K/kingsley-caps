const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.UUID, allowNull: false },
  store_id: { type: DataTypes.UUID, allowNull: false },
  method: { type: DataTypes.ENUM('crypto_eth', 'card', 'transfer'), allowNull: false },
  amount_fiat: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency_fiat: { type: DataTypes.STRING(3), defaultValue: 'GTQ' },
  amount_crypto: { type: DataTypes.DECIMAL(18, 8), allowNull: true },
  crypto_currency: { type: DataTypes.STRING(10), allowNull: true },
  exchange_rate: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
  rate_locked_at: { type: DataTypes.DATE, allowNull: true },
  tx_hash: { type: DataTypes.STRING(66), allowNull: true },
  wallet_from: { type: DataTypes.STRING(42), allowNull: true },
  wallet_to: { type: DataTypes.STRING(42), allowNull: true },
  network: { type: DataTypes.STRING(20), allowNull: true },
  confirmations: { type: DataTypes.INTEGER, defaultValue: 0 },
  block_number: { type: DataTypes.BIGINT, allowNull: true },
  nonce: { type: DataTypes.STRING(100), allowNull: true },
  transfer_proof_url: { type: DataTypes.STRING(500), allowNull: true },
  transfer_reference: { type: DataTypes.STRING(120), allowNull: true },
  submitted_at: { type: DataTypes.DATE, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
  reviewed_by: { type: DataTypes.UUID, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'refunded', 'discrepancy'), allowNull: false, defaultValue: 'pending' },
  initiated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  confirmed_at: { type: DataTypes.DATE, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'payment_transaction', underscored: true });

module.exports = PaymentTransaction;
