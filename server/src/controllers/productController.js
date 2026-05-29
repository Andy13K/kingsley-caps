const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/productService');
const storeService = require('../services/storeService');

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
    const store = await storeService.findMine(req.user.id, req.user.role);
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

const tryOn = asyncHandler(async (req, res) => {
  const aiService = require('../services/aiService');
  const { productId } = req.params;

  const product = await productService.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, error: { message: 'Producto no encontrado' } });
  }

  const files = req.files || {};
  if (!files.userPhoto || !files.userPhoto[0] || !files.capImage || !files.capImage[0]) {
    return res.status(400).json({
      success: false,
      error: { message: 'Se requieren ambas imágenes: foto del usuario y gorra' },
    });
  }

  const userPhotoPath = files.userPhoto[0].path;
  const capImagePath = files.capImage[0].path;

  const result = await aiService.analyzeVirtualTryOn({
    userPhotoPath,
    capImagePath,
    capName: product.name,
    capDescription: product.description || '',
  });

  res.json({ success: true, data: result });
});

module.exports = { list, listMine, getById, create, update, archive, uploadImages, tryOn };
