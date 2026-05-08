const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
      productVariantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_variant_id',
      },
      productName: { type: DataTypes.STRING(255), allowNull: false, field: 'product_name' },
      variantSize: { type: DataTypes.STRING(10), field: 'variant_size' },
      variantColor: { type: DataTypes.STRING(50), field: 'variant_color' },
      sku: { type: DataTypes.STRING(100) },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      tableName: 'order_item',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['order_id'] }],
    }
  );

  return OrderItem;
};
