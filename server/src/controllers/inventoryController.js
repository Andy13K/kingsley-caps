const asyncHandler = require('../utils/asyncHandler');
const inventoryService = require('../services/inventoryService');
const AppError = require('../utils/AppError');
const aiService = require('../services/aiService');
const { Store } = require('../models');

const getStoreForVendor = async (userId) => {
  const store = await Store.findOne({ where: { vendor_id: userId } });
  if (!store) throw new AppError('No tienes una tienda asociada', 403);
  return store;
};

const getVariantStock = asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  const store = await getStoreForVendor(req.user.id);
  const variant = await inventoryService.getVariantStock({ variantId, storeId: store.id });
  res.json({ success: true, data: { variant } });
});

const serializeVariant = (variant) => {
  const json = variant.toJSON ? variant.toJSON() : variant;
  return {
    ...json,
    product_name: json.Product?.name || json.product_name,
  };
};

const listVariants = asyncHandler(async (req, res) => {
  const store = await getStoreForVendor(req.user.id);
  const variants = await inventoryService.listVariants({ storeId: store.id });
  res.json({ success: true, data: { variants: variants.map(serializeVariant) } });
});

const adjustStock = asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  const { quantity, type, reason } = req.body;
  const store = await getStoreForVendor(req.user.id);
  const result = await inventoryService.adjustStock({
    productVariantId: variantId,
    quantity,
    type,
    reason,
    userId: req.user.id,
    storeId: store.id,
  });
  res.json({ success: true, data: result });
});

const getAlerts = asyncHandler(async (req, res) => {
  const store = await getStoreForVendor(req.user.id);
  const alerts = await inventoryService.getAlerts({ storeId: store.id });
  res.json({ success: true, data: { alerts: alerts.map(serializeVariant), count: alerts.length } });
});

const getMovements = asyncHandler(async (req, res) => {
  const store = await getStoreForVendor(req.user.id);
  const { movements, total, page, limit, totalPages } = await inventoryService.getMovements({
    storeId: store.id,
    filters: req.query,
  });
  res.json({
    success: true,
    data: { movements },
    meta: { page, limit, total, totalPages },
  });
});

const getDemandPredictions = asyncHandler(async (req, res) => {
  const store = await getStoreForVendor(req.user.id);
  const productsData = await inventoryService.getDemandData(store.id);
  const result = await aiService.predictDemand(store.id, productsData);
  res.json({
    success: true,
    data: {
      predictions: result.predictions,
      forecastDays: result.forecastDays,
      generatedAt: result.generatedAt,
    },
  });
});

module.exports = {
  listVariants, getVariantStock, adjustStock, getAlerts, getMovements, getDemandPredictions,
};
