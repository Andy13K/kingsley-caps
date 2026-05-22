const { sequelize, Cart, CartItem, ProductVariant, Product } = require('../models');
const {
  NotFoundError,
  ForbiddenError,
  BusinessError,
} = require('../utils/AppError');

const ITEM_INCLUDE = {
  model: CartItem,
  as: 'items',
  include: [
    {
      model: ProductVariant,
      include: [{ model: Product }],
    },
  ],
};

const computeTotals = (items) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
  return { subtotal: Number(subtotal.toFixed(2)), itemCount: items.length };
};

const getCart = async ({ userId, storeId }) => {
  if (!storeId) {
    const carts = await Cart.findAll({
      where: { userId },
      include: [ITEM_INCLUDE],
      order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
    });
    const items = carts.flatMap((cart) => cart.items || []);
    return { id: null, userId, storeId: null, items, ...computeTotals(items) };
  }

  const cart = await Cart.findOne({
    where: { userId, storeId },
    include: [ITEM_INCLUDE],
    order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
  });

  if (!cart) {
    return { id: null, userId, storeId, items: [], subtotal: 0, itemCount: 0 };
  }

  return { ...cart.toJSON(), ...computeTotals(cart.items) };
};

const resolveUnitPrice = (variant) =>
  Number(variant.price_override ?? variant.Product.base_price);

const addItem = async ({ userId, storeId, productVariantId, quantity }) => {
  return sequelize.transaction(async (t) => {
    const variant = await ProductVariant.findByPk(productVariantId, {
      include: [{ model: Product }],
      transaction: t,
    });

    if (!variant || variant.store_id !== storeId) {
      throw new NotFoundError('Variante de producto');
    }
    if (!variant.active) {
      throw new BusinessError('Variante inactiva', 'VARIANT_INACTIVE');
    }
    if (variant.stock < quantity) {
      throw new BusinessError(
        `Solo ${variant.stock} unidad(es) disponible(s)`,
        'INSUFFICIENT_STOCK'
      );
    }

    const [cart] = await Cart.findOrCreate({
      where: { userId, storeId },
      defaults: { userId, storeId },
      transaction: t,
    });

    const [item, created] = await CartItem.findOrCreate({
      where: { cartId: cart.id, productVariantId },
      defaults: {
        cartId: cart.id,
        productVariantId,
        quantity,
        unitPrice: resolveUnitPrice(variant),
      },
      transaction: t,
    });

    if (!created) {
      const newQty = item.quantity + quantity;
      if (variant.stock < newQty) {
        throw new BusinessError(
          `Solo ${variant.stock} unidad(es) disponible(s)`,
          'INSUFFICIENT_STOCK'
        );
      }
      await item.update({ quantity: newQty }, { transaction: t });
    }

    return item;
  });
};

const findItemForUser = async ({ itemId, userId, transaction }) => {
  const item = await CartItem.findByPk(itemId, {
    include: [{ model: Cart }, { model: ProductVariant }],
    transaction,
  });

  if (!item) {
    throw new NotFoundError('Item del carrito');
  }
  if (item.Cart.userId !== userId) { // Cart.userId es camelCase (modelo propio)
    throw new ForbiddenError('No puedes modificar items ajenos');
  }
  return item;
};

const updateItem = async ({ itemId, userId, quantity }) => {
  return sequelize.transaction(async (t) => {
    const item = await findItemForUser({ itemId, userId, transaction: t });
    if (item.ProductVariant.stock < quantity) {
      throw new BusinessError(
        `Solo ${item.ProductVariant.stock} unidad(es) disponible(s)`,
        'INSUFFICIENT_STOCK'
      );
    }
    await item.update({ quantity }, { transaction: t });
    return item;
  });
};

const removeItem = async ({ itemId, userId }) => {
  return sequelize.transaction(async (t) => {
    const item = await findItemForUser({ itemId, userId, transaction: t });
    await item.destroy({ transaction: t });
    return { success: true };
  });
};

const clearCart = async ({ userId, storeId }) => {
  return sequelize.transaction(async (t) => {
    if (!storeId) {
      const carts = await Cart.findAll({ where: { userId }, transaction: t });
      await CartItem.destroy({ where: { cartId: carts.map((cart) => cart.id) }, transaction: t });
      return { success: true };
    }

    const cart = await Cart.findOne({ where: { userId, storeId }, transaction: t });
    if (!cart) {
      return { success: true };
    }
    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
    return { success: true };
  });
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
