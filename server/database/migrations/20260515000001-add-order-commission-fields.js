'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('order', 'platform_fee_rate', {
      type: Sequelize.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.1,
    });
    await queryInterface.addColumn('order', 'platform_fee_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('order', 'vendor_payout_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('order', 'vendor_payout_amount');
    await queryInterface.removeColumn('order', 'platform_fee_amount');
    await queryInterface.removeColumn('order', 'platform_fee_rate');
  },
};
