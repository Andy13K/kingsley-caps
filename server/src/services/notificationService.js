const { Op } = require('sequelize');
const { Notification, User, Store } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const createNotification = async ({ userId, storeId = null, type, title, message, metadata = {} }) => {
  const notification = await Notification.create({ user_id: userId, store_id: storeId, type, title, message, metadata });
  return notification;
};

const createLowStockAlert = async ({ variant, stockAfter }) => {
  const store = await Store.findOne({ where: { id: variant.store_id } });
  if (!store) return;

  await Notification.create({
    user_id: store.vendor_id,
    store_id: store.id,
    type: 'low_stock',
    title: `Stock bajo: ${variant.sku}`,
    message: `La variante ${variant.sku} tiene ${stockAfter} unidades disponibles (umbral mínimo: ${variant.low_stock_threshold}). Considera reabastecer pronto.`,
    metadata: {
      variantId: variant.id,
      productId: variant.product_id,
      currentStock: stockAfter,
      threshold: variant.low_stock_threshold,
      sku: variant.sku,
    },
  });
};

const createOrderStatusNotification = async ({ order, oldStatus, newStatus }) => {
  const STATUS_TITLES = {
    paid: 'Pago confirmado',
    preparing: 'Pedido en preparación',
    packed: 'Pedido empacado',
    shipped: 'Pedido enviado',
    delivered: 'Pedido entregado',
    cancelled: 'Pedido cancelado',
    refunded: 'Pedido reembolsado',
  };

  const title = STATUS_TITLES[newStatus] || `Estado actualizado: ${newStatus}`;
  const message = `Tu pedido #${String(order.id).slice(0, 8).toUpperCase()} cambió de "${oldStatus}" a "${newStatus}".`;

  await Notification.create({
    user_id: order.customer_id,
    store_id: order.store_id,
    type: 'order_status',
    title,
    message,
    metadata: { orderId: order.id, oldStatus, newStatus },
  });
};

const createPaymentConfirmedNotification = async ({ order, payment }) => {
  const shortId = String(order.id).slice(0, 8).toUpperCase();

  await Notification.create({
    user_id: order.customer_id,
    store_id: order.store_id,
    type: 'payment_confirmed',
    title: 'Pago confirmado',
    message: `Tu pago de Q${payment.amount_fiat} para el pedido #${shortId} fue confirmado exitosamente.`,
    metadata: { orderId: order.id, paymentId: payment.id, amountGtq: payment.amount_fiat },
  });

  const store = await Store.findOne({ where: { id: order.store_id } });
  if (store) {
    await Notification.create({
      user_id: store.vendor_id,
      store_id: store.id,
      type: 'payment_received',
      title: 'Nuevo pago recibido',
      message: `Recibiste un pago de Q${payment.amount_fiat} (${payment.amount_crypto} ETH) para el pedido #${shortId}.`,
      metadata: { orderId: order.id, paymentId: payment.id, amountGtq: payment.amount_fiat, amountEth: payment.amount_crypto },
    });
  }
};

const createDiscrepancyAlert = async ({ payment, order }) => {
  const superadmins = await User.findAll({ where: { role: 'superadmin' }, attributes: ['id'] });

  await Promise.all(
    superadmins.map((admin) =>
      Notification.create({
        user_id: admin.id,
        store_id: payment.store_id,
        type: 'payment_discrepancy',
        title: 'ERR-C06: Discrepancia de monto',
        message: `Pago ${payment.id} con discrepancia de monto. Esperado: ${payment.amount_crypto} ETH. Orden: #${String(order.id).slice(0, 8).toUpperCase()}.`,
        metadata: {
          paymentId: payment.id,
          orderId: order.id,
          expectedEth: payment.amount_crypto,
          storeId: payment.store_id,
        },
      })
    )
  );
};

const getUserNotifications = async ({ userId, unreadOnly = false, type, page = 1, limit = 20 }) => {
  const where = { user_id: userId };
  if (unreadOnly) where.read = false;
  if (type) where.type = type;

  const { count: total, rows: notifications } = await Notification.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit,
  });

  const unreadCount = await Notification.count({ where: { user_id: userId, read: false } });

  return { notifications, total, unreadCount };
};

const markAsRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findOne({ where: { id: notificationId, user_id: userId } });
  if (!notification) {
    throw new AppError('Notificación no encontrada', 404);
  }
  await notification.update({ read: true });
  return notification;
};

const markAllAsRead = async ({ userId }) => {
  await Notification.update({ read: true }, { where: { user_id: userId, read: false } });
};

const getUnreadCount = async ({ userId }) => {
  return Notification.count({ where: { user_id: userId, read: false } });
};

module.exports = {
  createNotification,
  createLowStockAlert,
  createOrderStatusNotification,
  createPaymentConfirmedNotification,
  createDiscrepancyAlert,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
