'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variant', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product', key: 'id' },
        onDelete: 'CASCADE',
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store', key: 'id' },
      },
      size: { type: Sequelize.STRING(10) },
      color: { type: Sequelize.STRING(50) },
      sku: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      price_override: { type: Sequelize.DECIMAL(10, 2) },
      low_stock_threshold: { type: Sequelize.INTEGER, defaultValue: 3 },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE product_variant ADD CONSTRAINT chk_stock_non_negative CHECK (stock >= 0);'
    );
    await queryInterface.addIndex('product_variant', ['product_id'], {
      name: 'idx_variant_product',
    });
    await queryInterface.addIndex('product_variant', ['store_id'], {
      name: 'idx_variant_store',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_variant');
  },
};
