const { Op } = require('sequelize');
const { sequelize, Product, ProductVariant, Store } = require('../models');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../utils/AppError');

const VARIANT_INCLUDE = { model: ProductVariant, as: 'variants' };

const buildListWhere = (filters) => {
  const where = { status: 'active' };
  if (filters.storeId) {
    where.storeId = filters.storeId;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {};
    if (filters.minPrice !== undefined) {
      where.basePrice[Op.gte] = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.basePrice[Op.lte] = filters.maxPrice;
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
  const include = [VARIANT_INCLUDE];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
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

const findById = async (id) => {
  const product = await Product.findByPk(id, { include: [VARIANT_INCLUDE] });
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
  if (store.vendorId !== userId) {
    throw new ForbiddenError('No eres propietario de esta tienda');
  }
  return store;
};

const checkSkuUnique = async (skus, transaction, excludeProductId = null) => {
  const where = { sku: { [Op.in]: skus } };
  if (excludeProductId) {
    where.productId = { [Op.ne]: excludeProductId };
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
      {
        storeId,
        name: payload.name,
        description: payload.description,
        basePrice: payload.basePrice,
        category: payload.category,
        images: payload.images,
        tags: payload.tags,
        featured: payload.featured,
        status: payload.status,
      },
      { transaction: t }
    );

    if (payload.variants?.length > 0) {
      const variantData = payload.variants.map((v) => ({
        ...v,
        productId: product.id,
        storeId,
      }));
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
  await assertStoreOwner(product.storeId, vendorId);

  await product.update(payload);
  return Product.findByPk(id, { include: [VARIANT_INCLUDE] });
};

const archive = async ({ id, vendorId }) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError('Producto');
  }
  await assertStoreOwner(product.storeId, vendorId);

  await product.update({ status: 'archived' });
  return product;
};

module.exports = { list, findById, create, update, archive };
