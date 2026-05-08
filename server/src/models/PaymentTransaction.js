const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentTransaction = sequelize.define(
    'PaymentTransaction',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
      storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
      method: {
        type: DataTypes.ENUM('crypto_eth', 'card', 'transfer'),
        allowNull: false,
      },
      amountFiat: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'amount_fiat' },
      currencyFiat: { type: DataTypes.STRING(3), defaultValue: 'GTQ', field: 'currency_fiat' },
      amountCrypto: { type: DataTypes.DECIMAL(18, 8), field: 'amount_crypto' },
      cryptoCurrency: { type: DataTypes.STRING(10), field: 'crypto_currency' },
      exchangeRate: { type: DataTypes.DECIMAL(18, 6), field: 'exchange_rate' },
      rateLockedAt: { type: DataTypes.DATE, field: 'rate_locked_at' },
      txHash: { type: DataTypes.STRING(66), field: 'tx_hash' },
      walletFrom: { type: DataTypes.STRING(42), field: 'wallet_from' },
      walletTo: { type: DataTypes.STRING(42), field: 'wallet_to' },
      network: { type: DataTypes.ENUM('sepolia', 'mainnet') },
      confirmations: { type: DataTypes.INTEGER, defaultValue: 0 },
      blockNumber: { type: DataTypes.BIGINT, field: 'block_number' },
      nonce: { type: DataTypes.STRING(100) },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'failed', 'refunded', 'discrepancy'),
        defaultValue: 'pending',
      },
      initiatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'initiated_at',
      },
      confirmedAt: { type: DataTypes.DATE, field: 'confirmed_at' },
      expiresAt: { type: DataTypes.DATE, field: 'expires_at' },
    },
    {
      tableName: 'payment_transaction',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['order_id'] },
        { unique: true, fields: ['tx_hash'], where: { tx_hash: { [require('sequelize').Op.ne]: null } } },
      ],
    }
  );

  return PaymentTransaction;
};
