const { Op } = require('sequelize');
const { sequelize, ProductVariant, Product, InventoryMovement, User, Order, OrderItem } = require('../models');
const AppError = require('../utils/AppError');
const notificationService = require('./notificationService');

const getVariantStock = async ({ variantId, storeId }) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, store_id: storeId },
    include: [{ model: Product }],
  });
  if (!variant) {throw new AppError('Variante no encontrada', 404);}
  return variant;
};

const listVariants = async ({ storeId }) => {
  return ProductVariant.findAll({
    where: { store_id: storeId },
    include: [{ model: Product }],
    order: [['sku', 'ASC']],
  });
};

const adjustStock = async ({ productVariantId, quantity, type, reason, userId, storeId }) => {
  return sequelize.transaction(async (t) => {
    const variant = await ProductVariant.findOne({
      where: { id: productVariantId, store_id: storeId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!variant) {throw new AppError('Variante no encontrada', 404);}

    const stockBefore = variant.stock;
    const stockAfter = type === 'in' ? stockBefore + quantity : stockBefore - quantity;

    if (stockAfter < 0) {throw new AppError('Stock insuficiente', 400);}

    await variant.update({ stock: stockAfter }, { transaction: t });

    const movement = await InventoryMovement.create({
      product_variant_id: productVariantId,
      store_id: storeId,
      type,
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reason,
      created_by: userId,
    }, { transaction: t });

    if (stockAfter <= variant.low_stock_threshold) {
      await notificationService.createLowStockAlert({ variant, stockAfter });
    }

    return { variant, movement };
  });
};

const getAlerts = async ({ storeId }) => {
  const variants = await ProductVariant.findAll({
    where: {
      store_id: storeId,
      [Op.and]: sequelize.literal('"ProductVariant"."stock" <= "ProductVariant"."low_stock_threshold"'),
    },
    include: [{ model: Product }],
  });
  return variants;
};

const getMovements = async ({ storeId, filters }) => {
  const { variantId, type, dateFrom, dateTo, page, limit } = filters;
  const offset = (page - 1) * limit;

  const where = { store_id: storeId };
  if (variantId) {where.product_variant_id = variantId;}
  if (type) {where.type = type;}
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {where.created_at[Op.gte] = dateFrom;}
    if (dateTo) {where.created_at[Op.lte] = dateTo;}
  }

  const { count, rows } = await InventoryMovement.findAndCountAll({
    where,
    include: [
      { model: ProductVariant },
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    offset,
    limit,
  });

  return {
    movements: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

const registerMovement = async ({
  productVariantId,
  storeId,
  type,
  quantity,
  stockBefore,
  stockAfter,
  reason,
  referenceId,
  userId,
}) => {
  return InventoryMovement.create({
    product_variant_id: productVariantId,
    store_id: storeId,
    type,
    quantity,
    stock_before: stockBefore,
    stock_after: stockAfter,
    reason,
    reference_id: referenceId,
    created_by: userId,
  });
};

const getDemandData = async (storeId) => {
  const PAID_STATUSES = ['paid', 'preparing', 'packed', 'shipped', 'delivered'];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Include zero-sales products so vendor sees all active products, not just ones with orders
  const products = await Product.findAll({
    where: { store_id: storeId, status: 'active' },
    attributes: ['id', 'name', 'category'],
  });

  // Initialize a 30-slot array for each product (index 0 = 30 days ago, index 29 = yesterday)
  const productMap = new Map();
  for (const p of products) {
    productMap.set(p.id, {
      product_id: p.id,
      product_name: p.name,
      category: p.category,
      daily_sales: new Array(30).fill(0),
    });
  }

  // Fetch all qualifying orders with items and variant→product mapping
  const orders = await Order.findAll({
    where: {
      store_id: storeId,
      status: { [Op.in]: PAID_STATUSES },
      created_at: { [Op.gte]: thirtyDaysAgo },
    },
    include: [{
      model: OrderItem,
      as: 'items',
      include: [{ model: ProductVariant, attributes: ['id', 'product_id'] }],
      attributes: ['product_variant_id', 'quantity'],
    }],
    attributes: ['id', 'created_at'],
  });

  // Accumulate quantities into the correct day bucket
  const now = Date.now();
  for (const order of orders) {
    const daysAgo = Math.floor((now - new Date(order.created_at).getTime()) / (24 * 60 * 60 * 1000));
    // daysAgo=0 → today → arrayIndex=29; daysAgo=29 → arrayIndex=0
    const arrayIndex = 29 - daysAgo;
    if (arrayIndex < 0 || arrayIndex > 29) continue;

    for (const item of order.items) {
      const productId = item.ProductVariant?.product_id;
      if (!productId || !productMap.has(productId)) continue;
      productMap.get(productId).daily_sales[arrayIndex] += item.quantity;
    }
  }

  return Array.from(productMap.values());
};

module.exports = { listVariants, getVariantStock, adjustStock, getAlerts, getMovements, registerMovement, getDemandData };
