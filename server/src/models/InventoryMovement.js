const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InventoryMovement = sequelize.define(
    'InventoryMovement',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productVariantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_variant_id',
      },
      storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
      type: {
        type: DataTypes.ENUM('in', 'out', 'adjustment', 'reserved', 'released'),
        allowNull: false,
      },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      stockBefore: { type: DataTypes.INTEGER, allowNull: false, field: 'stock_before' },
      stockAfter: { type: DataTypes.INTEGER, allowNull: false, field: 'stock_after' },
      reason: { type: DataTypes.STRING(100) },
      referenceId: { type: DataTypes.UUID, field: 'reference_id' },
      createdBy: { type: DataTypes.UUID, field: 'created_by' },
    },
    {
      tableName: 'inventory_movement',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );

  return InventoryMovement;
};
