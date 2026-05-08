const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cart_id: { type: DataTypes.UUID, allowNull: false },
  product_variant_id: { type: DataTypes.UUID, allowNull: false },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'cart_item',
  underscored: true,
  indexes: [{ unique: true, fields: ['cart_id', 'product_variant_id'] }],
});

module.exports = CartItem;
