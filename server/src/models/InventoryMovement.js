const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryMovement = sequelize.define('InventoryMovement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_variant_id: { type: DataTypes.UUID, allowNull: false },
  store_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('in', 'out', 'adjustment', 'reserved', 'released'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  stock_before: { type: DataTypes.INTEGER, allowNull: false },
  stock_after: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING(100), allowNull: true },
  reference_id: { type: DataTypes.UUID, allowNull: true },
  created_by: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'inventory_movement', underscored: true, timestamps: true, updatedAt: false });

module.exports = InventoryMovement;
