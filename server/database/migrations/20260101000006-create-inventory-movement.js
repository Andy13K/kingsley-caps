'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_movement', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      product_variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variant', key: 'id' },
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store', key: 'id' },
      },
      type: {
        type: Sequelize.ENUM('in', 'out', 'adjustment', 'reserved', 'released'),
        allowNull: false,
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      stock_before: { type: Sequelize.INTEGER, allowNull: false },
      stock_after: { type: Sequelize.INTEGER, allowNull: false },
      reason: { type: Sequelize.STRING(100) },
      reference_id: { type: Sequelize.UUID },
      created_by: {
        type: Sequelize.UUID,
        references: { model: 'user', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('inventory_movement', ['product_variant_id'], {
      name: 'idx_inv_move_variant',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory_movement');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventory_movement_type";');
  },
};
