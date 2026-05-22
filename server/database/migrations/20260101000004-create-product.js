'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT },
      base_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      category: { type: Sequelize.STRING(100) },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'archived'),
        defaultValue: 'draft',
      },
      featured: { type: Sequelize.BOOLEAN, defaultValue: false },
      images: { type: Sequelize.JSONB, defaultValue: [] },
      tags: { type: Sequelize.ARRAY(Sequelize.TEXT) },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE product ADD CONSTRAINT chk_product_price CHECK (base_price >= 0);'
    );
    await queryInterface.addIndex('product', ['store_id'], { name: 'idx_product_store' });
    await queryInterface.addIndex('product', ['store_id', 'status'], {
      name: 'idx_product_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_product_status";');
  },
};
