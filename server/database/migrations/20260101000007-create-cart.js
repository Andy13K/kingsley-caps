'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user', key: 'id' },
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('cart', ['user_id', 'store_id'], {
      unique: true,
      name: 'uq_cart_user_store',
    });

    await queryInterface.createTable('cart_item', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      cart_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'cart', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variant', key: 'id' },
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE cart_item ADD CONSTRAINT chk_cart_item_qty CHECK (quantity > 0);'
    );
    await queryInterface.addIndex('cart_item', ['cart_id', 'product_variant_id'], {
      unique: true,
      name: 'uq_cart_item',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cart_item');
    await queryInterface.dropTable('cart');
  },
};
