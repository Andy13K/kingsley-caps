'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'store', key: 'id' },
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user', key: 'id' },
      },
      status: {
        type: Sequelize.ENUM(
          'pending_payment',
          'paid',
          'preparing',
          'packed',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        ),
        defaultValue: 'pending_payment',
      },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      tax_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      shipping_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      discount_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), defaultValue: 'GTQ' },
      shipping_address: { type: Sequelize.JSONB, allowNull: false },
      shipping_method: { type: Sequelize.STRING(100) },
      tracking_number: { type: Sequelize.STRING(100) },
      tracking_company: { type: Sequelize.STRING(100) },
      payment_method: { type: Sequelize.STRING(20) },
      customer_notes: { type: Sequelize.TEXT },
      vendor_notes: { type: Sequelize.TEXT },
      paid_at: { type: Sequelize.DATE },
      shipped_at: { type: Sequelize.DATE },
      delivered_at: { type: Sequelize.DATE },
      cancelled_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('order', ['store_id'], { name: 'idx_order_store' });
    await queryInterface.addIndex('order', ['customer_id'], { name: 'idx_order_customer' });
    await queryInterface.addIndex('order', ['store_id', 'status'], {
      name: 'idx_order_status',
    });

    await queryInterface.createTable('order_item', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'order', key: 'id' },
        onDelete: 'CASCADE',
      },
      product_variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variant', key: 'id' },
      },
      product_name: { type: Sequelize.STRING(255), allowNull: false },
      variant_size: { type: Sequelize.STRING(10) },
      variant_color: { type: Sequelize.STRING(50) },
      sku: { type: Sequelize.STRING(100) },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE order_item ADD CONSTRAINT chk_order_item_qty CHECK (quantity > 0);'
    );
    await queryInterface.addIndex('order_item', ['order_id'], { name: 'idx_order_item_order' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_item');
    await queryInterface.dropTable('order');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_status";');
  },
};
