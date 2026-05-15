const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');
const { Store } = require('../models');

const list = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.list(req.query);
  res.json({ success: true, data: products, meta });
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.findById(req.params.id);
  res.json({ success: true, data: product });
});

const listMine = asyncHandler(async (req, res) => {
  const { products, meta } = await productService.listForVendor({
    vendorId: req.user.id,
    filters: req.query,
  });
  res.json({ success: true, data: products, meta });
});

const create = asyncHandler(async (req, res) => {
  const { storeId, ...payload } = req.body;
  let targetStoreId = storeId || req.user.storeId;
  if (!targetStoreId) {
    const store = await Store.findOne({ where: { vendor_id: req.user.id } });
    targetStoreId = store?.id;
  }
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

const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length < 3 || files.length > 5) {
    res.status(400).json({
      success: false,
      error: { message: 'Debes subir entre 3 y 5 imagenes.' },
    });
    return;
  }

  const urls = files.map((file) => `/uploads/products/${file.filename}`);
  res.status(201).json({ success: true, data: { images: urls } });
});

module.exports = { list, listMine, getById, create, update, archive, uploadImages };
