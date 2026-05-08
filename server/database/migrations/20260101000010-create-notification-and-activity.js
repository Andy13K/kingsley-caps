'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification', {
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
        references: { model: 'store', key: 'id' },
      },
      type: { type: Sequelize.STRING(50), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      read: { type: Sequelize.BOOLEAN, defaultValue: false },
      metadata: { type: Sequelize.JSONB },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('notification', ['user_id', 'read'], {
      name: 'idx_notification_user',
    });

    await queryInterface.createTable('activity_log', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'user', key: 'id' },
      },
      store_id: {
        type: Sequelize.UUID,
        references: { model: 'store', key: 'id' },
      },
      action: { type: Sequelize.STRING(100), allowNull: false },
      entity_type: { type: Sequelize.STRING(50) },
      entity_id: { type: Sequelize.UUID },
      ip_address: { type: Sequelize.INET },
      user_agent: { type: Sequelize.TEXT },
      metadata: { type: Sequelize.JSONB },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('activity_log', ['store_id'], { name: 'idx_activity_store' });
    await queryInterface.addIndex('activity_log', ['user_id'], { name: 'idx_activity_user' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activity_log');
    await queryInterface.dropTable('notification');
  },
};
