const asyncHandler = require('../utils/asyncHandler');
const cartService = require('../services/cartService');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart({
    userId: req.user.id,
    storeId: req.query.storeId,
  });
  res.json({ success: true, data: cart });
});

const addItem = asyncHandler(async (req, res) => {
  const item = await cartService.addItem({
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: item });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await cartService.updateItem({
    itemId: req.params.itemId,
    userId: req.user.id,
    quantity: req.body.quantity,
  });
  res.json({ success: true, data: item });
});

const removeItem = asyncHandler(async (req, res) => {
  await cartService.removeItem({
    itemId: req.params.itemId,
    userId: req.user.id,
  });
  res.json({ success: true, data: { removed: true } });
});

const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart({
    userId: req.user.id,
    storeId: req.query.storeId,
  });
  res.json({ success: true, data: { cleared: true } });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
