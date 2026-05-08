const { Op } = require('sequelize');
const { Store } = require('../models');
const slugify = require('../utils/slugify');
const {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BusinessError,
} = require('../utils/AppError');

const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;
  while (await Store.findOne({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
};

const assertOwner = (store, userId) => {
  if (!store) {
    throw new NotFoundError('Tienda');
  }
  if (store.vendorId !== userId) {
    throw new ForbiddenError('Solo el propietario puede modificar esta tienda');
  }
};

const create = async ({ vendorId, name, description, logoUrl }) => {
  const existing = await Store.findOne({ where: { vendorId } });
  if (existing) {
    throw new ConflictError('Este vendedor ya tiene una tienda registrada');
  }

  const conflict = await Store.findOne({ where: { name } });
  if (conflict) {
    throw new ConflictError('Ya existe una tienda con ese nombre');
  }

  const slug = await generateUniqueSlug(name);
  return Store.create({ vendorId, name, slug, description, logoUrl });
};

const findMine = async (vendorId) => {
  const store = await Store.findOne({ where: { vendorId } });
  if (!store) {
    throw new NotFoundError('Tienda');
  }
  return store;
};

const findById = async (id) => {
  const store = await Store.findByPk(id);
  if (!store) {
    throw new NotFoundError('Tienda');
  }
  return store;
};

const update = async ({ id, vendorId, payload }) => {
  const store = await Store.findByPk(id);
  assertOwner(store, vendorId);

  if (payload.name && payload.name !== store.name) {
    const conflict = await Store.findOne({
      where: { name: payload.name, id: { [Op.ne]: id } },
    });
    if (conflict) {
      throw new ConflictError('Ya existe una tienda con ese nombre');
    }
  }

  await store.update(payload);
  return store;
};

const updateCryptoConfig = async ({ id, vendorId, payload }) => {
  const store = await Store.findByPk(id);
  assertOwner(store, vendorId);

  await store.update({
    cryptoEnabled: payload.cryptoEnabled ?? true,
    ethWalletAddress: payload.ethWalletAddress,
    ethConfirmationsRequired: payload.ethConfirmationsRequired ?? 3,
  });
  return store;
};

const publish = async ({ id, vendorId }) => {
  const store = await Store.findByPk(id);
  assertOwner(store, vendorId);

  if (store.status === 'active') {
    return store;
  }
  if (store.status !== 'draft') {
    throw new BusinessError(
      `No se puede publicar una tienda en estado "${store.status}"`,
      'INVALID_STORE_STATE'
    );
  }
  await store.update({ status: 'active' });
  return store;
};

module.exports = {
  create,
  findMine,
  findById,
  update,
  updateCryptoConfig,
  publish,
};
