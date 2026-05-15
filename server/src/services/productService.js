const { Op } = require('sequelize');
const { sequelize, Product, ProductVariant, Store } = require('../models');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../utils/AppError');

const VARIANT_INCLUDE = { model: ProductVariant, as: 'variants' };

const toProductPayload = (payload = {}) => ({
  ...(payload.name !== undefined ? { name: payload.name } : {}),
  ...(payload.description !== undefined ? { description: payload.description } : {}),
  ...(payload.basePrice !== undefined ? { base_price: payload.basePrice } : {}),
  ...(payload.base_price !== undefined ? { base_price: payload.base_price } : {}),
  ...(payload.category !== undefined ? { category: payload.category } : {}),
  ...(payload.images !== undefined ? { images: payload.images } : {}),
  ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
  ...(payload.featured !== undefined ? { featured: payload.featured } : {}),
  ...(payload.status !== undefined ? { status: payload.status } : {}),
});

const toVariantPayload = (variant, productId, storeId) => ({
  product_id: productId,
  store_id: storeId,
  size: variant.size,
  color: variant.color,
  sku: variant.sku,
  stock: variant.stock,
  price_override: variant.priceOverride ?? variant.price_override ?? null,
  low_stock_threshold: variant.lowStockThreshold ?? variant.low_stock_threshold ?? 3,
  active: variant.active ?? true,
});

const buildListWhere = (filters) => {
  const where = { status: 'active' };
  if (filters.storeId) {
    where.store_id = filters.storeId;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.base_price = {};
    if (filters.minPrice !== undefined) {
      where.base_price[Op.gte] = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.base_price[Op.lte] = filters.maxPrice;
    }
  }
  if (filters.search) {
    where.name = { [Op.iLike]: `%${filters.search}%` };
  }
  return where;
};

const list = async (filters) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const offset = (page - 1) * limit;

  const where = buildListWhere(filters);
  const include = [VARIANT_INCLUDE, { model: Store, where: { status: 'active' }, attributes: ['id', 'name', 'slug', 'status'] }];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  let products = rows;
  if (filters.available) {
    products = rows.filter((p) =>
      p.variants?.some((v) => v.active && v.stock > 0)
    );
  }

  return {
    products,
    meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

const listForVendor = async ({ vendorId, filters = {} }) => {
  const store = await Store.findOne({ where: { vendor_id: vendorId } });
  if (!store) {
    throw new NotFoundError('Tienda');
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const offset = (page - 1) * limit;
  const where = { store_id: store.id };
  if (filters.status) where.status = filters.status;

  const { rows, count } = await Product.findAndCountAll({
    where,
    include: [VARIANT_INCLUDE],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return {
    products: rows,
    meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

const findById = async (id) => {
  const product = await Product.findOne({
    where: { id, status: 'active' },
    include: [
      VARIANT_INCLUDE,
      { model: Store, where: { status: 'active' }, attributes: ['id', 'name', 'slug', 'status'] },
    ],
  });
  if (!product) {
    throw new NotFoundError('Producto');
  }
  return product;
};

const assertStoreOwner = async (storeId, userId) => {
  const store = await Store.findByPk(storeId);
  if (!store) {
    throw new NotFoundError('Tienda');
  }
  if (store.vendor_id !== userId) {
    throw new ForbiddenError('No eres propietario de esta tienda');
  }
  return store;
};

const checkSkuUnique = async (skus, transaction, excludeProductId = null) => {
  const where = { sku: { [Op.in]: skus } };
  if (excludeProductId) {
    where.product_id = { [Op.ne]: excludeProductId };
  }
  const existing = await ProductVariant.findAll({ where, transaction });
  if (existing.length > 0) {
    throw new ConflictError(`SKU duplicado: ${existing.map((v) => v.sku).join(', ')}`);
  }
};

const create = async ({ storeId, vendorId, payload }) => {
  await assertStoreOwner(storeId, vendorId);

  return sequelize.transaction(async (t) => {
    const skus = (payload.variants ?? []).map((v) => v.sku);
    if (skus.length !== new Set(skus).size) {
      throw new ConflictError('SKUs duplicados en la solicitud');
    }
    if (skus.length > 0) {
      await checkSkuUnique(skus, t);
    }

    const product = await Product.create(
      { store_id: storeId, ...toProductPayload(payload) },
      { transaction: t }
    );

    if (payload.variants?.length > 0) {
      const variantData = payload.variants.map((v) => toVariantPayload(v, product.id, storeId));
      await ProductVariant.bulkCreate(variantData, { transaction: t });
    }

    return Product.findByPk(product.id, {
      include: [VARIANT_INCLUDE],
      transaction: t,
    });
  });
};

const update = async ({ id, vendorId, payload }) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Producto');
  }
  await assertStoreOwner(product.store_id, vendorId);

  return sequelize.transaction(async (t) => {
    await product.update(toProductPayload(payload), { transaction: t });

    if (payload.variants?.length > 0) {
      const skus = payload.variants.map((v) => v.sku);
      if (skus.length !== new Set(skus).size) {
        throw new ConflictError('SKUs duplicados en la solicitud');
      }
      await checkSkuUnique(skus, t, id);

      for (const variant of payload.variants) {
        if (variant.id) {
          const existing = await ProductVariant.findOne({
            where: { id: variant.id, product_id: id, store_id: product.store_id },
            transaction: t,
          });
          if (!existing) {
            throw new NotFoundError('Variante');
          }
          await existing.update(toVariantPayload(variant, id, product.store_id), { transaction: t });
        } else {
          await ProductVariant.create(toVariantPayload(variant, id, product.store_id), { transaction: t });
        }
      }
    }

    return Product.findByPk(id, { include: [VARIANT_INCLUDE], transaction: t });
  });
};

const archive = async ({ id, vendorId }) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Producto');
  }
  await assertStoreOwner(product.store_id, vendorId);

  await product.update({ status: 'archived' });
  return product;
};

module.exports = { list, listForVendor, findById, create, update, archive };
