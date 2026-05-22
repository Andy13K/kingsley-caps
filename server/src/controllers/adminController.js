const asyncHandler = require('../utils/asyncHandler');
const { Store, User, Order, PaymentTransaction, Product, ProductVariant } = require('../models');
const { NotFoundError } = require('../utils/AppError');

const serializeStore = (store) => {
  const json = store.toJSON();
  return {
    ...json,
    vendor_name: json.vendor?.name || '',
    vendor_email: json.vendor?.email || '',
  };
};

const listStores = asyncHandler(async (req, res) => {
  const stores = await Store.findAll({
    include: [{ model: User, as: 'vendor', attributes: ['id', 'name', 'email', 'status'] }],
    order: [['created_at', 'DESC']],
  });

  res.json({ success: true, data: { stores: stores.map(serializeStore) } });
});

const metrics = asyncHandler(async (req, res) => {
  const [totalStores, activeStores, totalUsers, totalProducts, totalStock, salesGtq, salesEth] = await Promise.all([
    Store.count(),
    Store.count({ where: { status: 'active' } }),
    User.count(),
    Product.count(),
    ProductVariant.sum('stock'),
    Order.sum('total'),
    PaymentTransaction.sum('amount_crypto', { where: { method: 'crypto_eth', status: 'confirmed' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalStores,
      activeStores,
      totalUsers,
      totalProducts,
      totalStock: Number(totalStock || 0),
      totalSalesGtq: Number(salesGtq || 0),
      totalSalesEth: Number(salesEth || 0).toFixed(4),
    },
  });
});

const inventory = asyncHandler(async (req, res) => {
  const stores = await Store.findAll({
    include: [
      { model: User, as: 'vendor', attributes: ['id', 'name', 'email'] },
      {
        model: Product,
        attributes: ['id', 'name', 'status', 'category'],
        include: [{ model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'stock', 'low_stock_threshold', 'active'] }],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const rows = stores.map((store) => {
    const json = store.toJSON();
    const products = json.Products || json.products || [];
    const variants = products.flatMap((product) => product.variants || []);
    const stock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
    const lowStock = variants.filter((variant) => variant.active && Number(variant.stock || 0) <= Number(variant.low_stock_threshold || 0)).length;

    return {
      id: json.id,
      name: json.name,
      slug: json.slug,
      status: json.status,
      vendor_name: json.vendor?.name || '',
      vendor_email: json.vendor?.email || '',
      product_count: products.length,
      variant_count: variants.length,
      stock,
      low_stock: lowStock,
      is_official: json.slug === 'kingsley-caps-oficial',
    };
  });

  res.json({ success: true, data: { inventory: rows } });
});

const approveStore = asyncHandler(async (req, res) => {
  const store = await Store.findByPk(req.params.id);
  if (!store) {throw new NotFoundError('Tienda');}

  await store.update({ status: 'active' });
  await User.update({ status: 'active' }, { where: { id: store.vendor_id } });

  res.json({ success: true, data: store });
});

const suspendStore = asyncHandler(async (req, res) => {
  const store = await Store.findByPk(req.params.id);
  if (!store) {throw new NotFoundError('Tienda');}

  await store.update({ status: 'suspended' });
  await User.update({ status: 'suspended' }, { where: { id: store.vendor_id } });

  res.json({ success: true, data: store });
});

const reactivateStore = asyncHandler(async (req, res) => {
  const store = await Store.findByPk(req.params.id);
  if (!store) {throw new NotFoundError('Tienda');}

  await store.update({ status: 'active' });
  await User.update({ status: 'active' }, { where: { id: store.vendor_id } });

  res.json({ success: true, data: store });
});

module.exports = { listStores, metrics, inventory, approveStore, suspendStore, reactivateStore };
