const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  storeId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'cart',
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'store_id'] }],
});

module.exports = Cart;
