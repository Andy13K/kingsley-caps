const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      storeId: { type: DataTypes.UUID, allowNull: false, field: 'store_id' },
      customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
      status: {
        type: DataTypes.ENUM(
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
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'tax_amount' },
      shippingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'shipping_amount',
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'discount_amount',
      },
      total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), defaultValue: 'GTQ' },
      shippingAddress: { type: DataTypes.JSONB, allowNull: false, field: 'shipping_address' },
      shippingMethod: { type: DataTypes.STRING(100), field: 'shipping_method' },
      trackingNumber: { type: DataTypes.STRING(100), field: 'tracking_number' },
      trackingCompany: { type: DataTypes.STRING(100), field: 'tracking_company' },
      paymentMethod: { type: DataTypes.STRING(20), field: 'payment_method' },
      customerNotes: { type: DataTypes.TEXT, field: 'customer_notes' },
      vendorNotes: { type: DataTypes.TEXT, field: 'vendor_notes' },
      paidAt: { type: DataTypes.DATE, field: 'paid_at' },
      shippedAt: { type: DataTypes.DATE, field: 'shipped_at' },
      deliveredAt: { type: DataTypes.DATE, field: 'delivered_at' },
      cancelledAt: { type: DataTypes.DATE, field: 'cancelled_at' },
    },
    {
      tableName: 'order',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['store_id'] },
        { fields: ['customer_id'] },
        { fields: ['store_id', 'status'] },
      ],
    }
  );

  return Order;
};
