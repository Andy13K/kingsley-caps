const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');

const list = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.list(req.query);
  res.json({ success: true, data: products, meta });
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.findById(req.params.id);
  res.json({ success: true, data: product });
});

const create = asyncHandler(async (req, res) => {
  const { storeId, ...payload } = req.body;
  const targetStoreId = storeId || req.user.storeId;
  const product = await productService.create({
    storeId: targetStoreId,
    vendorId: req.user.id,
    payload,
  });
  res.status(201).json({ success: true, data: product });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update({
    id: req.params.id,
    vendorId: req.user.id,
    payload: req.body,
  });
  res.json({ success: true, data: product });
});

const archive = asyncHandler(async (req, res) => {
  const product = await productService.archive({
    id: req.params.id,
    vendorId: req.user.id,
  });
  res.json({ success: true, data: product });
});

module.exports = { list, getById, create, update, archive };
