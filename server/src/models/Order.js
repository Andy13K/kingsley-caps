const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  store_id: { type: DataTypes.UUID, allowNull: false },
  customer_id: { type: DataTypes.UUID, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending_payment', 'paid', 'preparing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'),
    allowNull: false, defaultValue: 'pending_payment',
  },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  shipping_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  platform_fee_rate: { type: DataTypes.DECIMAL(5, 4), defaultValue: 0.1 },
  platform_fee_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  vendor_payout_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(3), defaultValue: 'GTQ' },
  shipping_address: { type: DataTypes.JSONB, allowNull: true },
  shipping_method: { type: DataTypes.STRING(100), allowNull: true },
  tracking_number: { type: DataTypes.STRING(100), allowNull: true },
  tracking_company: { type: DataTypes.STRING(100), allowNull: true },
  payment_method: { type: DataTypes.STRING(20), allowNull: true },
  customer_notes: { type: DataTypes.TEXT, allowNull: true },
  vendor_notes: { type: DataTypes.TEXT, allowNull: true },
  paid_at: { type: DataTypes.DATE, allowNull: true },
  shipped_at: { type: DataTypes.DATE, allowNull: true },
  delivered_at: { type: DataTypes.DATE, allowNull: true },
  cancelled_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'order', underscored: true });

module.exports = Order;
