const { Op } = require('sequelize');
const { Product, ProductVariant } = require('../models');

const getComparableProducts = async (storeId, category, excludeProductId = null) => {
  const where = {
    store_id: storeId,
    category,
    status: 'active',
  };
  if (excludeProductId) {
    where.id = { [Op.ne]: excludeProductId };
  }

  const products = await Product.findAll({
    where,
    include: [{
      model: ProductVariant,
      as: 'variants',
      where: { active: true },
      required: false,
    }],
    limit: 50,
  });

  return products.map((p) => {
    const overrides = p.variants
      .filter((v) => v.price_override !== null)
      .map((v) => parseFloat(v.price_override));
    const effectivePrice = overrides.length > 0
      ? overrides.reduce((a, b) => a + b, 0) / overrides.length
      : parseFloat(p.base_price);
    return { name: p.name, price: effectivePrice };
  });
};

module.exports = { getComparableProducts };
