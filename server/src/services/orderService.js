const { Op } = require('sequelize');
const {
  sequelize,
  Cart,
  CartItem,
  ProductVariant,
  Product,
  Order,
  OrderItem,
  Store,
  User,
  InventoryMovement,
  PaymentTransaction,
} = require('../models');
const { platformCommissionRate } = require('../config/marketplace');
const notificationService = require('./notificationService');
const storeService = require('./storeService');
const {
  NotFoundError,
  ForbiddenError,
  BusinessError,
} = require('../utils/AppError');

const ORDER_INCLUDE = [
  { model: OrderItem, as: 'items' },
  { model: PaymentTransaction, as: 'payments' },
  { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
  { model: Store, attributes: ['id', 'name', 'slug', 'vendor_id'] },
];

const VALID_TRANSITIONS = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled', 'refunded'],
  preparing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

const fetchCartForCheckout = async (userId, storeId, transaction) => {
  const cart = await Cart.findOne({
    where: { userId, storeId },
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [{ model: ProductVariant, include: [Product] }],
      },
    ],
    transaction,
  });
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new BusinessError('Carrito vacio', 'EMPTY_CART');
  }
  return cart;
};

const fetchDirectItemsForCheckout = async (items, transaction) => {
  const normalized = items.map((item) => ({
    productVariantId: item.productVariantId ?? item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));
  const variantIds = normalized.map((item) => item.productVariantId);
  const variants = await ProductVariant.findAll({
    where: { id: { [Op.in]: variantIds } },
    include: [Product],
    transaction,
  });
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  return normalized.map((item) => {
    const variant = variantsById.get(item.productVariantId);
    if (!variant) {
      throw new NotFoundError('Variante de producto');
    }
    return {
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      unitPrice: Number(variant.price_override ?? variant.Product.base_price),
      ProductVariant: variant,
    };
  });
};

const verifyStockOrThrow = (items) => {
  for (const item of items) {
    const stock = item.ProductVariant.stock;
    if (stock < item.quantity) {
      throw new BusinessError(
        `Stock insuficiente para ${item.ProductVariant.sku} (disponible ${stock})`,
        'INSUFFICIENT_STOCK'
      );
    }
  }
};

const resolveCheckoutItems = async ({ userId, storeId, items, transaction }) => {
  if (items?.length > 0) {
    const directItems = await fetchDirectItemsForCheckout(items, transaction);
    const detectedStoreIds = new Set(directItems.map((item) => item.ProductVariant.store_id));
    if (detectedStoreIds.size > 1) {
      throw new BusinessError('Solo se puede crear una orden para una tienda a la vez', 'MULTI_STORE_ORDER');
    }
    const detectedStoreId = [...detectedStoreIds][0];
    if (storeId && storeId !== detectedStoreId) {
      throw new BusinessError('Los productos no pertenecen a la tienda indicada', 'STORE_MISMATCH');
    }
    return { checkoutItems: directItems, resolvedStoreId: detectedStoreId };
  }

  if (!storeId) {
    throw new BusinessError('storeId es requerido cuando no se envian items', 'STORE_REQUIRED');
  }
  const cart = await fetchCartForCheckout(userId, storeId, transaction);
  return { checkoutItems: cart.items, resolvedStoreId: storeId, cart };
};

const computeOrderTotals = (items, shippingAmount = 0) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
  const total = Number((subtotal + Number(shippingAmount)).toFixed(2));
  const normalizedSubtotal = Number(subtotal.toFixed(2));
  const platformFeeAmount = Number((normalizedSubtotal * platformCommissionRate).toFixed(2));
  const vendorPayoutAmount = Number((total - platformFeeAmount).toFixed(2));
  return {
    subtotal: normalizedSubtotal,
    total,
    platformFeeRate: platformCommissionRate,
    platformFeeAmount,
    vendorPayoutAmount,
  };
};

const createOrderItems = async ({ orderId, cartItems, transaction }) =>
  OrderItem.bulkCreate(
    cartItems.map((item) => ({
      order_id: orderId,
      product_variant_id: item.productVariantId,
      product_name: item.ProductVariant.Product.name,
      variant_size: item.ProductVariant.size,
      variant_color: item.ProductVariant.color,
      sku: item.ProductVariant.sku,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: Number((Number(item.unitPrice) * item.quantity).toFixed(2)),
    })),
    { transaction }
  );

const reserveStockAndLog = async ({ checkoutItems, orderId, userId, storeId, transaction }) => {
  for (const item of checkoutItems) {
    const variant = item.ProductVariant;
    const stockBefore = variant.stock;
    const stockAfter = stockBefore - item.quantity;
    await variant.update({ stock: stockAfter }, { transaction });
    await InventoryMovement.create(
      {
        product_variant_id: variant.id,
        store_id: storeId,
        type: 'reserved',
        quantity: -item.quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason: 'checkout_reservation',
        reference_id: orderId,
        created_by: userId,
      },
      { transaction }
    );
  }
};

const createOrderNotification = async (order) => {
  try {
    const store = await Store.findByPk(order.store_id);
    if (!store) {return;}
    const itemSummary = (order.items || [])
      .map((item) => `${item.product_name} x${item.quantity}`)
      .join(', ');
    await notificationService.createNotification({
      userId: store.vendor_id,
      storeId: store.id,
      type: 'new_order',
      title: 'Nuevo pedido recibido',
      message: `Pedido #${String(order.id).slice(0, 8).toUpperCase()}: ${itemSummary || 'productos por despachar'}.`,
      metadata: { orderId: order.id, total: order.total, items: itemSummary },
    });
  } catch (_) {
    // Notifications must not block checkout.
  }
};

const create = async ({
  userId,
  storeId,
  items,
  shippingAddress,
  paymentMethod,
  shippingMethod,
  shippingAmount = 0,
  customerNotes,
}) => {
  const order = await sequelize.transaction(async (t) => {
    const { checkoutItems, resolvedStoreId, cart } = await resolveCheckoutItems({
      userId,
      storeId,
      items,
      transaction: t,
    });
    verifyStockOrThrow(checkoutItems);

    const {
      subtotal,
      total,
      platformFeeRate,
      platformFeeAmount,
      vendorPayoutAmount,
    } = computeOrderTotals(checkoutItems, shippingAmount);

    const order = await Order.create(
      {
        store_id: resolvedStoreId,
        customer_id: userId,
        status: 'pending_payment',
        subtotal,
        shipping_amount: shippingAmount,
        platform_fee_rate: platformFeeRate,
        platform_fee_amount: platformFeeAmount,
        vendor_payout_amount: vendorPayoutAmount,
        total,
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        customer_notes: customerNotes,
      },
      { transaction: t }
    );

    await createOrderItems({ orderId: order.id, cartItems: checkoutItems, transaction: t });
    await reserveStockAndLog({
      checkoutItems,
      orderId: order.id,
      userId,
      storeId: resolvedStoreId,
      transaction: t,
    });

    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
    }

    return Order.findByPk(order.id, { include: ORDER_INCLUDE, transaction: t });
  });
  await createOrderNotification(order);
  return order;
};

const buildListWhere = ({ user, filters, vendorStoreId }) => {
  const where = {};
  if (user.role === 'customer') {
    where.customer_id = user.id;
  } else if (user.role === 'vendor' || user.role === 'staff' || user.role === 'superadmin') {
    if (filters.storeId) {
      where.store_id = filters.storeId;
    } else {
      where.store_id = user.storeId || vendorStoreId;
    }
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.created_at = {};
    if (filters.dateFrom) {
      where.created_at[Op.gte] = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.created_at[Op.lte] = filters.dateTo;
    }
  }
  return where;
};

const list = async ({ user, filters }) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;
  let vendorStoreId = null;
  if ((user.role === 'vendor' || user.role === 'staff' || user.role === 'superadmin') && !user.storeId && !filters.storeId) {
    const store = user.role === 'superadmin'
      ? await storeService.findMine(user.id, user.role)
      : await Store.findOne({ where: { vendor_id: user.id } });
    vendorStoreId = store?.id || null;
  }

  const { rows, count } = await Order.findAndCountAll({
    where: buildListWhere({ user, filters, vendorStoreId }),
    include: ORDER_INCLUDE,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return {
    orders: rows,
    meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

const assertCanAccessOrder = async (orderId, user) => {
  const order = await Order.findByPk(orderId, { include: ORDER_INCLUDE });
  if (!order) {
    throw new NotFoundError('Orden');
  }

  if (user.role === 'customer' && order.customer_id !== user.id) {
    throw new ForbiddenError('No puedes ver una orden de otro cliente');
  }
  if (user.role === 'vendor' || user.role === 'staff' || user.role === 'superadmin') {
    const store = await Store.findByPk(order.store_id);
    if (user.role === 'superadmin' && storeService.isOfficialStore(store)) {
      return order;
    }
    if (!store || store.vendor_id !== user.id) {
      throw new ForbiddenError('La orden no pertenece a tu tienda');
    }
  }
  return order;
};

const findById = async ({ id, user }) => assertCanAccessOrder(id, user);

const transitionTimestamps = (status) => {
  const now = new Date();
  if (status === 'paid') {return { paid_at: now };}
  if (status === 'shipped') {return { shipped_at: now };}
  if (status === 'delivered') {return { delivered_at: now };}
  if (status === 'cancelled') {return { cancelled_at: now };}
  return {};
};

const updateStatus = async ({ id, user, status, vendorNotes }) => {
  const order = await assertCanAccessOrder(id, user);

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new BusinessError(
      `Transicion invalida: ${order.status} -> ${status}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const oldStatus = order.status;
  await order.update({ status, vendor_notes: vendorNotes, ...transitionTimestamps(status) });
  await notificationService.createOrderStatusNotification({ order, oldStatus, newStatus: status });
  return order;
};

const setTracking = async ({ id, user, trackingNumber, trackingCompany }) => {
  const order = await assertCanAccessOrder(id, user);
  if (!['paid', 'preparing', 'packed', 'shipped'].includes(order.status)) {
    throw new BusinessError(
      'Solo se puede registrar guia tras pago confirmado',
      'INVALID_STATUS_FOR_TRACKING'
    );
  }
  await order.update({ tracking_number: trackingNumber, tracking_company: trackingCompany });
  return order;
};

const restoreStock = async ({ order, userId, transaction }) => {
  for (const item of order.items) {
    const variant = await ProductVariant.findByPk(item.product_variant_id, { transaction });
    if (!variant) {continue;}
    const stockBefore = variant.stock;
    const stockAfter = stockBefore + item.quantity;
    await variant.update({ stock: stockAfter }, { transaction });
    await InventoryMovement.create(
      {
        product_variant_id: variant.id,
        store_id: order.store_id,
        type: 'released',
        quantity: item.quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason: 'reservation_release',
        reference_id: order.id,
        created_by: userId,
      },
      { transaction }
    );
  }
};

const cancel = async ({ id, user }) => {
  return sequelize.transaction(async (t) => {
    const order = await assertCanAccessOrder(id, user);
    if (!['pending_payment', 'paid', 'preparing'].includes(order.status)) {
      throw new BusinessError(
        `No se puede cancelar una orden en estado "${order.status}"`,
        'CANNOT_CANCEL'
      );
    }
    if (user.role === 'customer' && order.customer_id !== user.id) {
      throw new ForbiddenError();
    }

    await restoreStock({ order, userId: user.id, transaction: t });
    await order.update({ status: 'cancelled', cancelled_at: new Date() }, { transaction: t });
    return order;
  });
};

module.exports = { create, list, findById, updateStatus, setTracking, cancel };
