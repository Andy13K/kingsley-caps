const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');

const uploadDir = path.resolve(__dirname, '..', '..', '..', 'client', 'public', 'uploads', 'shipping');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const extensionByType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50) || 'guia-envio';
    const ext = extensionByType[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${safeName}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

module.exports = multer({
  storage,
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new AppError('Solo se permiten imagenes JPG, PNG, WEBP o GIF', 400));
      return;
    }
    cb(null, true);
  },
});
