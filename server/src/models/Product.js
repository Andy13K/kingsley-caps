const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  store_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: true },
  status: { type: DataTypes.ENUM('draft', 'active', 'archived'), allowNull: false, defaultValue: 'draft' },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  images: { type: DataTypes.JSONB, defaultValue: [] },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
}, { tableName: 'product', underscored: true });

module.exports = Product;
