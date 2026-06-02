const asyncHandler = require('../utils/asyncHandler');
const pricingService = require('../services/pricingService');
const aiService = require('../services/aiService');
const AppError = require('../utils/AppError');
const { Store } = require('../models');

const getStoreForUser = async (userId, userRole) => {
  if (userRole === 'superadmin') {
    const official = await Store.findOne({ where: { slug: 'kingsley-caps-oficial' } });
    if (official) { return official; }
  }
  const store = await Store.findOne({ where: { vendor_id: userId } });
  if (!store) { throw new AppError('No tienes una tienda asociada', 403); }
  return store;
};

const suggestProductPrice = asyncHandler(async (req, res) => {
  const { category, tags, featured, exclude_product_id: excludeProductId } = req.body;
  const store = await getStoreForUser(req.user.id, req.user.role);
  const comparables = await pricingService.getComparableProducts(
    store.id,
    category,
    excludeProductId
  );
  const result = await aiService.suggestPrice(
    { name: '', category, tags: tags || [], featured: featured || false },
    comparables
  );
  res.json({ success: true, data: result });
});

module.exports = { suggestProductPrice };
