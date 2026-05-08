const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'base_price',
        validate: { min: 0 },
      },
      category: { type: DataTypes.STRING(100) },
      status: {
        type: DataTypes.ENUM('draft', 'active', 'archived'),
        defaultValue: 'draft',
      },
      featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      images: { type: DataTypes.JSONB, defaultValue: [] },
      tags: { type: DataTypes.ARRAY(DataTypes.TEXT) },
    },
    {
      tableName: 'product',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['store_id'] },
        { fields: ['store_id', 'status'] },
      ],
    }
  );

  return Product;
};
