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
    userRole: req.user.role,
    filters: req.query,
  });
  res.json({ success: true, data: products, meta });
});

const create = asyncHandler(async (req, res) => {
  const { storeId, ...payload } = req.body;
  let targetStoreId = storeId || req.user.storeId;
  if (!targetStoreId) {
    const where = req.user.role === 'superadmin'
      ? { slug: 'kingsley-caps-oficial' }
      : { vendor_id: req.user.id };
    const store = await Store.findOne({ where });
    targetStoreId = store?.id;
  }
  const product = await productService.create({
    storeId: targetStoreId,
    vendorId: req.user.id,
    userRole: req.user.role,
    payload,
  });
  res.status(201).json({ success: true, data: product });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update({
    id: req.params.id,
    vendorId: req.user.id,
    userRole: req.user.role,
    payload: req.body,
  });
  res.json({ success: true, data: product });
});

const archive = asyncHandler(async (req, res) => {
  const product = await productService.archive({
    id: req.params.id,
    vendorId: req.user.id,
    userRole: req.user.role,
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
  const logger = require('../utils/logger');
  const path = require('path');
  const fs = require('fs');
  const { productId } = req.params;

  logger.info('[TRY-ON] Request received', { productId, hasBody: Boolean(req.body), bodyKeys: Object.keys(req.body || {}) });

  const product = await productService.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, error: { message: 'Producto no encontrado' } });
  }

  const files = req.files || {};
  if (!files.userPhoto || !files.userPhoto[0]) {
    logger.warn('[TRY-ON] Missing userPhoto file');
    return res.status(400).json({
      success: false,
      error: { message: 'Se requiere la foto del usuario' },
    });
  }

  const { capImageUrl } = req.body;
  if (!capImageUrl) {
    logger.warn('[TRY-ON] Missing capImageUrl');
    return res.status(400).json({
      success: false,
      error: { message: 'No se encontró imagen de la gorra' },
    });
  }

  let capImagePath;
  if (capImageUrl.startsWith('/uploads/')) {
    const uploadsBase = process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'uploads');
    capImagePath = path.join(uploadsBase, capImageUrl.replace(/^\/uploads\//, ''));
  } else {
    capImagePath = path.resolve(__dirname, '..', '..', '..', 'client', 'public', ...capImageUrl.replace(/^\//, '').split('/'));
  }

  const userPhotoPath = files.userPhoto[0].path;
  const capExists = fs.existsSync(capImagePath);
  const userExists = fs.existsSync(userPhotoPath);

  logger.info('[TRY-ON] Resolved paths', {
    capImageUrl,
    capImagePath,
    capExists,
    userPhotoPath,
    userExists,
    capName: product.name,
  });

  if (!capExists) {
    return res.json({
      success: true,
      data: {
        success: false,
        message: `No se encontró el archivo de la gorra en disco: ${capImagePath}`,
      },
    });
  }

  const result = await aiService.analyzeVirtualTryOn({
    userPhotoPath,
    capImagePath,
    capName: product.name,
    capDescription: product.description || '',
  });

  logger.info('[TRY-ON] AI service returned', {
    success: result?.success,
    hasUrl: Boolean(result?.generatedImageUrl),
    message: result?.message,
    error: result?.error,
  });

  res.json({ success: true, data: result });
});

module.exports = { list, listMine, getById, create, update, archive, uploadImages, tryOn };
