const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define(
    'CartItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      cartId: { type: DataTypes.UUID, allowNull: false, field: 'cart_id' },
      productVariantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_variant_id',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
      },
    },
    {
      tableName: 'cart_item',
      underscored: true,
      timestamps: true,
      indexes: [{ unique: true, fields: ['cart_id', 'product_variant_id'] }],
    }
  );

  return CartItem;
};
