'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transaction', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'order', key: 'id' },
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store', key: 'id' },
      },
      method: {
        type: Sequelize.ENUM('crypto_eth', 'card', 'transfer'),
        allowNull: false,
      },
      amount_fiat: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency_fiat: { type: Sequelize.STRING(3), defaultValue: 'GTQ' },
      amount_crypto: { type: Sequelize.DECIMAL(18, 8) },
      crypto_currency: { type: Sequelize.STRING(10) },
      exchange_rate: { type: Sequelize.DECIMAL(18, 6) },
      rate_locked_at: { type: Sequelize.DATE },
      tx_hash: { type: Sequelize.STRING(66) },
      wallet_from: { type: Sequelize.STRING(42) },
      wallet_to: { type: Sequelize.STRING(42) },
      network: { type: Sequelize.ENUM('sepolia', 'mainnet') },
      confirmations: { type: Sequelize.INTEGER, defaultValue: 0 },
      block_number: { type: Sequelize.BIGINT },
      nonce: { type: Sequelize.STRING(100) },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'failed', 'refunded', 'discrepancy'),
        defaultValue: 'pending',
      },
      initiated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      confirmed_at: { type: Sequelize.DATE },
      expires_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('payment_transaction', ['order_id'], {
      name: 'idx_payment_order',
    });
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX idx_payment_tx_hash ON payment_transaction(tx_hash) WHERE tx_hash IS NOT NULL;'
    );
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX idx_confirmed_payment ON payment_transaction(order_id) WHERE status = 'confirmed';"
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_transaction');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_payment_transaction_method";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_payment_transaction_status";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_payment_transaction_network";'
    );
  },
};
