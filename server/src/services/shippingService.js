const { Order, Store } = require('../models');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

const addTracking = async ({ orderId, trackingNumber, trackingCompany, userId }) => {
  const order = await Order.findOne({
    where: { id: orderId },
    include: [{ model: Store }],
  });

  if (!order) {throw new AppError('Orden no encontrada', 404);}
  if (order.Store.vendor_id !== userId) {throw new AppError('No tienes acceso a esta orden', 403);}

  const updateData = { tracking_number: trackingNumber, tracking_company: trackingCompany, shipped_at: new Date() };
  if (['preparing', 'packed'].includes(order.status)) {updateData.status = 'shipped';}

  await order.update(updateData);

  try {
    await notificationService.createNotification({
      userId: order.customer_id,
      storeId: order.store_id,
      type: 'order_shipped',
      title: 'Tu pedido ha sido enviado',
      message: `Tu pedido ha sido enviado. Guía: ${trackingNumber} (${trackingCompany})`,
      metadata: { orderId, trackingNumber, trackingCompany },
    });
  } catch (err) {
    logger.error('Failed to create shipping notification', { message: err.message });
  }

  return order;
};

const getTrackingInfo = async ({ orderId, userId }) => {
  const order = await Order.findOne({
    where: { id: orderId },
    attributes: ['id', 'status', 'tracking_number', 'tracking_company', 'shipped_at', 'delivered_at', 'customer_id', 'store_id'],
    include: [{ model: Store, attributes: ['id', 'vendor_id'] }],
  });

  if (!order) {throw new AppError('Orden no encontrada', 404);}
  if (order.customer_id !== userId && order.Store.vendor_id !== userId) {
    throw new AppError('No tienes acceso a esta orden', 403);
  }

  return {
    orderId: order.id,
    status: order.status,
    trackingNumber: order.tracking_number,
    trackingCompany: order.tracking_company,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
  };
};

module.exports = { addTracking, getTrackingInfo };
