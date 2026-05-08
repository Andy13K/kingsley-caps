const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_id: { type: DataTypes.UUID, allowNull: false },
  store_id: { type: DataTypes.UUID, allowNull: false },
  size: { type: DataTypes.STRING(10), allowNull: true },
  color: { type: DataTypes.STRING(50), allowNull: true },
  sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  price_override: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  low_stock_threshold: { type: DataTypes.INTEGER, defaultValue: 3 },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'product_variant', underscored: true });

module.exports = ProductVariant;
