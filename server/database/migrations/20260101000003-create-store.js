'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('store', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user', key: 'id' },
      },
      name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      logo_url: { type: Sequelize.STRING(500) },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'suspended', 'closed'),
        defaultValue: 'draft',
      },
      plan: {
        type: Sequelize.ENUM('basic', 'pro', 'enterprise'),
        defaultValue: 'basic',
      },
      crypto_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
      eth_wallet_address: { type: Sequelize.STRING(42) },
      eth_confirmations_required: { type: Sequelize.INTEGER, defaultValue: 3 },
      shipping_methods: { type: Sequelize.JSONB },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('store');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_store_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_store_plan";');
  },
};
