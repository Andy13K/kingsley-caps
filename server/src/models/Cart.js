const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    'Cart',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
    },
    {
      tableName: 'cart',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['user_id', 'store_id'] }],
    }
  );

  return Cart;
};
