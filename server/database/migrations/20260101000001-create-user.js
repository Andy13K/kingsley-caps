'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(20) },
      address: { type: Sequelize.TEXT },
      role: {
        type: Sequelize.ENUM('superadmin', 'vendor', 'staff', 'customer'),
        allowNull: false,
        defaultValue: 'customer',
      },
      status: {
        type: Sequelize.ENUM('active', 'pending_approval', 'suspended'),
        defaultValue: 'active',
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_status";');
  },
};
