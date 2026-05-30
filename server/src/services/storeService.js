const { Op } = require('sequelize');
const { Store, Product, ProductVariant, User, Notification } = require('../models');
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
  if (store.vendor_id !== userId) {
    throw new ForbiddenError('Solo el propietario puede modificar esta tienda');
  }
};

const toStorePayload = (payload = {}) => ({
  ...(payload.name !== undefined ? { name: payload.name } : {}),
  ...(payload.description !== undefined ? { description: payload.description } : {}),
  ...(payload.logoUrl !== undefined ? { logo_url: payload.logoUrl } : {}),
  ...(payload.logo_url !== undefined ? { logo_url: payload.logo_url } : {}),
  ...(payload.shippingMethods !== undefined ? { shipping_methods: payload.shippingMethods } : {}),
  ...(payload.shipping_methods !== undefined ? { shipping_methods: payload.shipping_methods } : {}),
  ...(payload.cryptoEnabled !== undefined ? { crypto_enabled: payload.cryptoEnabled } : {}),
  ...(payload.crypto_enabled !== undefined ? { crypto_enabled: payload.crypto_enabled } : {}),
  ...(payload.ethWalletAddress !== undefined ? { eth_wallet_address: payload.ethWalletAddress } : {}),
  ...(payload.eth_wallet_address !== undefined ? { eth_wallet_address: payload.eth_wallet_address } : {}),
  ...(payload.ethConfirmationsRequired !== undefined ? { eth_confirmations_required: payload.ethConfirmationsRequired } : {}),
  ...(payload.eth_confirmations_required !== undefined ? { eth_confirmations_required: payload.eth_confirmations_required } : {}),
});

const create = async ({ vendorId, name, description, logoUrl, logo_url }) => {
  const existing = await Store.findOne({ where: { vendor_id: vendorId } });
  if (existing) {
    throw new ConflictError('Este vendedor ya tiene una tienda registrada');
  }

  const conflict = await Store.findOne({ where: { name } });
  if (conflict) {
    throw new ConflictError('Ya existe una tienda con ese nombre');
  }

  const slug = await generateUniqueSlug(name);
  const store = await Store.create({
    vendor_id: vendorId,
    name,
    slug,
    description,
    logo_url: logoUrl ?? logo_url ?? null,
  });
  const admins = await User.findAll({ where: { role: 'superadmin' }, attributes: ['id'] });
  await Promise.all(admins.map((admin) => Notification.create({
    user_id: admin.id,
    store_id: store.id,
    type: 'store_approval',
    title: 'Tienda pendiente de aprobacion',
    message: `La tienda "${store.name}" solicita aprobacion para vender en Kingsley Caps.`,
    metadata: { storeId: store.id, vendorId },
  })));
  return store;
};

const findMine = async (vendorId) => {
  const store = await Store.findOne({ where: { vendor_id: vendorId } });
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

const findPublicBySlug = async (slug) => {
  const store = await Store.findOne({
    where: { slug, status: 'active' },
    include: [
      {
        model: Product,
        where: { status: 'active' },
        required: false,
        include: [{ model: ProductVariant, as: 'variants', where: { active: true }, required: false }],
      },
    ],
    order: [[Product, 'created_at', 'DESC']],
  });
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

  await store.update(toStorePayload(payload));
  return store;
};

const updateCryptoConfig = async ({ id, vendorId, payload }) => {
  const store = await Store.findByPk(id);
  assertOwner(store, vendorId);

  await store.update({
    crypto_enabled: payload.cryptoEnabled ?? payload.crypto_enabled ?? true,
    eth_wallet_address: payload.ethWalletAddress ?? payload.eth_wallet_address,
    eth_confirmations_required: payload.ethConfirmationsRequired ?? payload.eth_confirmations_required ?? 3,
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
  await store.update({ status: 'draft' });
  return store;
};

module.exports = {
  create,
  findMine,
  findById,
  findPublicBySlug,
  update,
  updateCryptoConfig,
  publish,
};
