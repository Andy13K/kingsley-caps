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
  InventoryMovement,
  PaymentTransaction,
} = require('../models');
const {
  NotFoundError,
  ForbiddenError,
  BusinessError,
} = require('../utils/AppError');

const ORDER_INCLUDE = [
  { model: OrderItem, as: 'items' },
  { model: PaymentTransaction, as: 'payments' },
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

const computeOrderTotals = (items, shippingAmount = 0) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
  const total = Number((subtotal + Number(shippingAmount)).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), total };
};

const createOrderItems = async ({ orderId, cartItems, transaction }) =>
  OrderItem.bulkCreate(
    cartItems.map((item) => ({
      orderId,
      productVariantId: item.productVariantId,
      productName: item.ProductVariant.Product.name,
      variantSize: item.ProductVariant.size,
      variantColor: item.ProductVariant.color,
      sku: item.ProductVariant.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: Number((Number(item.unitPrice) * item.quantity).toFixed(2)),
    })),
    { transaction }
  );

const decrementStockAndLog = async ({ cartItems, orderId, userId, storeId, transaction }) => {
  for (const item of cartItems) {
    const variant = item.ProductVariant;
    const stockBefore = variant.stock;
    const stockAfter = stockBefore - item.quantity;
    await variant.update({ stock: stockAfter }, { transaction });
    await InventoryMovement.create(
      {
        productVariantId: variant.id,
        storeId,
        type: 'out',
        quantity: -item.quantity,
        stockBefore,
        stockAfter,
        reason: 'sale',
        referenceId: orderId,
        createdBy: userId,
      },
      { transaction }
    );
  }
};

const create = async ({
  userId,
  storeId,
  shippingAddress,
  paymentMethod,
  shippingMethod,
  shippingAmount = 0,
  customerNotes,
}) => {
  return sequelize.transaction(async (t) => {
    const cart = await fetchCartForCheckout(userId, storeId, t);
    verifyStockOrThrow(cart.items);

    const { subtotal, total } = computeOrderTotals(cart.items, shippingAmount);

    const order = await Order.create(
      {
        storeId,
        customerId: userId,
        status: 'pending_payment',
        subtotal,
        shippingAmount,
        total,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        customerNotes,
      },
      { transaction: t }
    );

    await createOrderItems({ orderId: order.id, cartItems: cart.items, transaction: t });
    await decrementStockAndLog({
      cartItems: cart.items,
      orderId: order.id,
      userId,
      storeId,
      transaction: t,
    });

    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    return Order.findByPk(order.id, { include: ORDER_INCLUDE, transaction: t });
  });
};

const buildListWhere = ({ user, filters }) => {
  const where = {};
  if (user.role === 'customer') {
    where.customerId = user.id;
  } else if (user.role === 'vendor' || user.role === 'staff') {
    if (filters.storeId) {
      where.storeId = filters.storeId;
    } else if (user.storeId) {
      where.storeId = user.storeId;
    }
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt[Op.gte] = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.createdAt[Op.lte] = filters.dateTo;
    }
  }
  return where;
};

const list = async ({ user, filters }) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;

  const { rows, count } = await Order.findAndCountAll({
    where: buildListWhere({ user, filters }),
    include: ORDER_INCLUDE,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
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

  if (user.role === 'customer' && order.customerId !== user.id) {
    throw new ForbiddenError('No puedes ver una orden de otro cliente');
  }
  if (user.role === 'vendor' || user.role === 'staff') {
    const store = await Store.findByPk(order.storeId);
    if (!store || store.vendorId !== user.id) {
      throw new ForbiddenError('La orden no pertenece a tu tienda');
    }
  }
  return order;
};

const findById = async ({ id, user }) => assertCanAccessOrder(id, user);

const transitionTimestamps = (status) => {
  const now = new Date();
  if (status === 'paid') {
    return { paidAt: now };
  }
  if (status === 'shipped') {
    return { shippedAt: now };
  }
  if (status === 'delivered') {
    return { deliveredAt: now };
  }
  if (status === 'cancelled') {
    return { cancelledAt: now };
  }
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

  await order.update({ status, vendorNotes, ...transitionTimestamps(status) });
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
  await order.update({ trackingNumber, trackingCompany });
  return order;
};

const restoreStock = async ({ order, transaction }) => {
  for (const item of order.items) {
    const variant = await ProductVariant.findByPk(item.productVariantId, { transaction });
    if (!variant) {
      continue;
    }
    const stockBefore = variant.stock;
    const stockAfter = stockBefore + item.quantity;
    await variant.update({ stock: stockAfter }, { transaction });
    await InventoryMovement.create(
      {
        productVariantId: variant.id,
        storeId: order.storeId,
        type: 'in',
        quantity: item.quantity,
        stockBefore,
        stockAfter,
        reason: 'cancel',
        referenceId: order.id,
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
    if (user.role === 'customer' && order.customerId !== user.id) {
      throw new ForbiddenError();
    }

    await restoreStock({ order, transaction: t });
    await order.update(
      { status: 'cancelled', cancelledAt: new Date() },
      { transaction: t }
    );
    return order;
  });
};

module.exports = { create, list, findById, updateStatus, setTracking, cancel };
