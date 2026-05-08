const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  order_id: { type: DataTypes.UUID, allowNull: false },
  product_variant_id: { type: DataTypes.UUID, allowNull: false },
  product_name: { type: DataTypes.STRING(255), allowNull: false },
  variant_size: { type: DataTypes.STRING(10), allowNull: true },
  variant_color: { type: DataTypes.STRING(50), allowNull: true },
  sku: { type: DataTypes.STRING(100), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'order_item', underscored: true, timestamps: true, updatedAt: false });

module.exports = OrderItem;
