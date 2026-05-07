const { Op } = require('sequelize');
const { sequelize, ProductVariant, Product, InventoryMovement, User } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

const getVariantStock = async ({ variantId, storeId }) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, store_id: storeId },
    include: [{ model: Product }],
  });
  if (!variant) throw new AppError('Variante no encontrada', 404);
  return variant;
};

const adjustStock = async ({ productVariantId, quantity, type, reason, userId, storeId }) => {
  return sequelize.transaction(async (t) => {
    const variant = await ProductVariant.findOne({
      where: { id: productVariantId, store_id: storeId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!variant) throw new AppError('Variante no encontrada', 404);

    const stockBefore = variant.stock;
    const stockAfter = type === 'in' ? stockBefore + quantity : stockBefore - quantity;
    if (stockAfter < 0) throw new AppError('Stock insuficiente', 400);

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
      try {
        await notificationService.createLowStockAlert({ variant, stockAfter });
      } catch (err) {
        logger.error('Failed to create low stock notification', { message: err.message });
      }
    }

    return { variant, movement };
  });
};

const getAlerts = async ({ storeId }) => {
  return ProductVariant.findAll({
    where: {
      store_id: storeId,
      [Op.and]: sequelize.literal('"product_variant"."stock" <= "product_variant"."low_stock_threshold"'),
    },
    include: [{ model: Product }],
  });
};

const getMovements = async ({ storeId, filters }) => {
  const { variantId, type, dateFrom, dateTo, page, limit } = filters;
  const offset = (page - 1) * limit;
  const where = { store_id: storeId };
  if (variantId) where.product_variant_id = variantId;
  if (type) where.type = type;
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = dateFrom;
    if (dateTo) where.created_at[Op.lte] = dateTo;
  }

  const { count, rows } = await InventoryMovement.findAndCountAll({
    where,
    include: [{ model: ProductVariant }, { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'DESC']],
    offset,
    limit,
  });

  return { movements: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const registerMovement = async ({ productVariantId, storeId, type, quantity, stockBefore, stockAfter, reason, referenceId, userId }) => {
  return InventoryMovement.create({
    product_variant_id: productVariantId, store_id: storeId, type, quantity,
    stock_before: stockBefore, stock_after: stockAfter, reason,
    reference_id: referenceId, created_by: userId,
  });
};

module.exports = { getVariantStock, adjustStock, getAlerts, getMovements, registerMovement };
