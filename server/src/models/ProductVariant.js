const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductVariant = sequelize.define(
    'ProductVariant',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
      storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
      size: { type: DataTypes.STRING(10) },
      color: { type: DataTypes.STRING(50) },
      sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      priceOverride: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'price_override',
        validate: { min: 0 },
      },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        field: 'low_stock_threshold',
      },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'product_variant',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['product_id'] },
        { fields: ['store_id'] },
      ],
    }
  );

  return ProductVariant;
};
