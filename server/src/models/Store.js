const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Store = sequelize.define(
    'Store',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      vendorId: { type: DataTypes.UUID, allowNull: false, field: 'vendor_id' },
      name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT },
      logoUrl: { type: DataTypes.STRING(500), field: 'logo_url' },
      status: {
        type: DataTypes.ENUM('draft', 'active', 'suspended', 'closed'),
        defaultValue: 'draft',
      },
      plan: {
        type: DataTypes.ENUM('basic', 'pro', 'enterprise'),
        defaultValue: 'basic',
      },
      cryptoEnabled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'crypto_enabled' },
      ethWalletAddress: {
        type: DataTypes.STRING(42),
        field: 'eth_wallet_address',
        validate: {
          is: /^0x[a-fA-F0-9]{40}$/,
        },
      },
      ethConfirmationsRequired: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        field: 'eth_confirmations_required',
      },
      shippingMethods: { type: DataTypes.JSONB, field: 'shipping_methods' },
    },
    {
      tableName: 'store',
      underscored: true,
      timestamps: true,
    }
  );

  return Store;
};
